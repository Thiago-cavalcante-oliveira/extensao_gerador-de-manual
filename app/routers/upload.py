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

from app.services.worker import process_video_job

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
        background_tasks.add_task(process_video_job, new_chapter.id, title)
        
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

# Endpoint moved to routers/chapter.py

# Import necessário para a query provisória
from sqlalchemy import select
