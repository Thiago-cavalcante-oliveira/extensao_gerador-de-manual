from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db, AsyncSessionLocal
from app.services.storage import storage
from app.services.ai_processor import ai_processor
from app.models.chapter import Chapter
from app.models.collection import Collection
import uuid
from sqlalchemy import select
import json

router = APIRouter()

from app.services.tts import tts_service

async def process_upload_background(chapter_id: int):
    """
    Função auxiliar que roda em background.
    Cria uma nova sessão de banco, chama a IA, gera ÁUDIO e atualiza o capítulo.
    """
    # Cria uma nova sessão pois a original da request já fechou
    async with AsyncSessionLocal() as db:
        try:
            print(f"[{chapter_id}] Iniciando processamento IA...")
            
            # 1. Buscar o capítulo
            result = await db.execute(select(Chapter).where(Chapter.id == chapter_id))
            chapter = result.scalars().first()
            
            if not chapter:
                print(f"[{chapter_id}] Capítulo não encontrado!")
                return

            chapter.status = "PROCESSING"
            await db.commit()

            # 2. Chamar IA (Real ou Mock)
            analyze_result = await ai_processor.analyze_video(chapter.video_url)
            
            # 3. Gerar Áudio (TTS) para cada passo
            print(f"[{chapter_id}] Gerando áudio para {len(analyze_result.get('steps', []))} passos...")
            
            if "steps" in analyze_result:
                for step in analyze_result["steps"]:
                    description = step.get("description", "")
                    if description:
                        # Gera o MP3 e salva no MinIO
                        audio_url = await tts_service.generate_audio(description)
                        step["audio_url"] = audio_url
            
            # 4. Atualizar capítulo
            # Agora salvamos o JSON enriquecido com as URLs de áudio
            chapter.text_content = json.dumps(analyze_result, ensure_ascii=False, indent=2)
            chapter.status = "DRAFT" # Pronto para revisão humana
            
            await db.commit()
            print(f"[{chapter_id}] Processamento e TTS concluídos com sucesso!")

        except Exception as e:
            print(f"[{chapter_id}] Erro no processamento: {e}")
            # Em caso de erro, voltar status ou marcar erro?
            # Por hora, deixamos no log. Poderíamos ter status ERROR.

@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    module_id: int = Form(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Recebe um vídeo (.webm, .mp4) e Título, salva no MinIO, cria registro e agenda IA.
    Agora cria um Guia (Collection) novo para cada vídeo (MVP: 1 Video = 1 Manual).
    """
    # 1. Validação Simples
    if not file.filename.endswith((".webm", ".mp4")):
        raise HTTPException(status_code=400, detail="Apenas arquivos .webm ou .mp4 são permitidos.")

    try:
        # 2. Ler o arquivo (Cuidado com memória em produção! Para MVP ok)
        file_content = await file.read()
        
        # 3. Gerar nome único para não sobrescrever
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        
        # 4. Salvar no MinIO
        video_path = storage.save_video(file_content, unique_filename, file.content_type)
        
        # 5. Criar registro no Banco
        
        # Cria uma nova Collection (Guia) para este manual
        new_collection = Collection(
            module_id=module_id,
            title=title,
            description=f"Manual gerado automaticamente a partir do vídeo '{title}'"
        )
        db.add(new_collection)
        await db.flush() # Para gerar o ID da collection

        new_chapter = Chapter(
            collection_id=new_collection.id,
            title=title, # Capítulo 1 tem o mesmo titulo do Guia
            video_url=video_path,
            status="PENDING"
        )
        
        db.add(new_chapter)
        await db.commit()
        await db.refresh(new_chapter)
        
        # 6. Agendar Processamento IA
        background_tasks.add_task(process_upload_background, new_chapter.id)
        
        return {
            "status": "success",
            "chapter_id": new_chapter.id,
            "collection_id": new_collection.id,
            "video_url": new_chapter.video_url,
            "message": "Upload recebido! Manual criado e processamento iniciado."
        }

    except Exception as e:
        print(f"Erro no upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ... imports mantidos ...

@router.get("/chapters/{chapter_id}")
async def get_chapter(chapter_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retorna o status e o conteúdo (Passos + Áudio) de um capítulo.
    Usado pelo Frontend para Polling.
    """
    result = await db.execute(select(Chapter).where(Chapter.id == chapter_id))
    chapter = result.scalars().first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Capítulo não encontrado")
    
    # Se tiver text_content (JSON), parseia para retornar objeto bonito
    content_parsed = None
    if chapter.text_content:
        try:
            content_parsed = json.loads(chapter.text_content)
        except:
            content_parsed = chapter.text_content

    return {
        "id": chapter.id,
        "title": chapter.title,
        "status": chapter.status, # PENDING, PROCESSING, DRAFT
        "video_url": chapter.video_url,
        "content": content_parsed, # Aqui virá o JSON com os passos e URLs de áudio
        "created_at": chapter.created_at
    }

# Import necessário para a query provisória
from sqlalchemy import select
