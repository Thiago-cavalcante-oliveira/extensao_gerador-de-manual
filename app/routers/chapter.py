from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models import Chapter, Collection, Module, System
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter()

class ChapterResponse(BaseModel):
    id: int
    title: str
    video_url: str
    status: str
    created_at: datetime
    # flattened context info
    system_name: str | None = None
    module_name: str | None = None
    # Content body (JSON or String)
    content: dict | list | str | None = None

    class Config:
        from_attributes = True

from app.services.storage import storage

@router.get("/chapters", response_model=list[ChapterResponse])
async def list_chapters(db: AsyncSession = Depends(get_db)):
    """Lista todos os capítulos (vídeos) com contexto de Sistema/Módulo."""
    stmt = (
        select(Chapter)
        .options(
            selectinload(Chapter.collection).selectinload(Collection.module).selectinload(Module.system)
        )
        .order_by(Chapter.created_at.desc())
    )
    result = await db.execute(stmt)
    chapters = result.scalars().all()
    
    # Transformar para o DTO achatado
    response = []
    for chap in chapters:
        sys_name = None
        mod_name = None
        if chap.collection and chap.collection.module:
            mod_name = chap.collection.module.name
            if chap.collection.module.system:
                sys_name = chap.collection.module.system.name
        
        # Gera URL assinada (Pre-signed) para acesso seguro
        full_video_url = storage.get_presigned_url(chap.video_url)
        
        response.append(ChapterResponse(
            id=chap.id,
            title=chap.title,
            video_url=full_video_url,
            status=chap.status,
            created_at=chap.created_at,
            system_name=sys_name,
            module_name=mod_name
        ))
        
    return response

@router.delete("/chapters/{chapter_id}")
async def delete_chapter(chapter_id: int, db: AsyncSession = Depends(get_db)):
    """Remove um capítulo (vídeo)."""
    result = await db.execute(select(Chapter).where(Chapter.id == chapter_id))
    chapter = result.scalar_one_or_none()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    await db.delete(chapter)
    await db.commit()
    return {"ok": True}

class ChapterUpdate(BaseModel):
    title: str | None = None
    content: dict | None = None

@router.put("/chapters/{chapter_id}")
async def update_chapter(chapter_id: int, payload: ChapterUpdate, db: AsyncSession = Depends(get_db)):
    """Atualiza o título e o conteúdo (Passos) do capítulo."""
    result = await db.execute(select(Chapter).where(Chapter.id == chapter_id))
    chapter = result.scalar_one_or_none()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if payload.title:
        chapter.title = payload.title
        
    if payload.content is not None:
        import json
        # Ensure it's stored as JSON string
        if isinstance(payload.content, (dict, list)):
            chapter.text_content = json.dumps(payload.content, ensure_ascii=False)
        else:
            chapter.text_content = str(payload.content)
            
    await db.commit()
    return {"ok": True}

@router.get("/chapters/{chapter_id}", response_model=ChapterResponse)
async def get_chapter(chapter_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retorna o status e o conteúdo (Passos + Áudio) de um capítulo.
    Usado para edição e playback.
    """
    stmt = (
        select(Chapter)
        .where(Chapter.id == chapter_id)
        .options(
            selectinload(Chapter.collection).selectinload(Collection.module).selectinload(Module.system)
        )
    )
    result = await db.execute(stmt)
    chapter = result.scalar_one_or_none()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Contexto Flattened
    sys_name = None
    mod_name = None
    if chapter.collection and chapter.collection.module:
        mod_name = chapter.collection.module.name
        if chapter.collection.module.system:
            sys_name = chapter.collection.module.system.name

    # Presigned URL
    full_video_url = storage.get_presigned_url(chapter.video_url)

    # Content Parsing (text_content armazena JSON na nossa impl)
    content_parsed = None
    if chapter.text_content:
        import json
        try:
            content_parsed = json.loads(chapter.text_content)
        except Exception:
            # Se não der pra parsear, retorna como string mesmo
            content_parsed = chapter.text_content
    
    
    # URL Proxy (Bypass MinIO access from browser)
    # Assinar URLs de áudio dentro dos passos -> AGORA USAM PROXY
    if isinstance(content_parsed, dict) and "steps" in content_parsed:
        for step in content_parsed["steps"]:
            if "audio_url" in step and step["audio_url"]:
                # step["audio_url"] is like "documentacao/audio/xyz.mp3"
                # We convert to "/api/v1/stream?path=documentacao/audio/xyz.mp3"
                step["audio_url"] = f"/api/v1/stream?path={step['audio_url']}"
    
    return ChapterResponse(
        id=chapter.id,
        title=chapter.title,
        video_url=full_video_url,
        status=chapter.status,
        created_at=chapter.created_at,
        system_name=sys_name,
        module_name=mod_name,
        content=content_parsed
    )

from fastapi.responses import StreamingResponse

@router.get("/stream")
async def stream_file(path: str):
    """
    Proxy para streamar arquivos do MinIO diretamente pela API.
    Evita problemas de CORS e Hostname (Docker vs Localhost).
    """
    try:
        # Pega o arquivo do MinIO (stream)
        # Se path vier com bucket (ex: "bucket/file.mp3"), removemos o bucket
        # pois o storage client já sabe o bucket configured
        
        filename = path
        if "/" in filename:
            # Remove o nome do bucket se estiver no inicio
            # Ex: "documentacao/audio/xyz.mp3" -> "audio/xyz.mp3"
            parts = filename.split("/", 1)
            if parts[0] == storage.bucket_name:
                filename = parts[1]
        
        # storage.client.get_object retorna um HTTPResponse que é um stream
        data = storage.client.get_object(storage.bucket_name, filename)
        
        return StreamingResponse(
            data, 
            media_type="audio/mpeg"
        )
    except Exception as e:
        print(f"Erro no stream: {e}")
        raise HTTPException(status_code=404, detail="File not found")

class RegenerateRequest(BaseModel):
    step_index: int
    text: str

from app.services.tts import tts_service
import json

@router.post("/chapters/{chapter_id}/regenerate_audio")
async def regenerate_audio(chapter_id: int, payload: RegenerateRequest, db: AsyncSession = Depends(get_db)):
    """
    Regenera o áudio de um passo específico usando o novo texto.
    Atualiza o campo `text_content` no banco de dados.
    """
    stmt = select(Chapter).where(Chapter.id == chapter_id)
    result = await db.execute(stmt)
    chapter = result.scalar_one_or_none()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    try:
        content = json.loads(chapter.text_content)
    except:
        raise HTTPException(status_code=500, detail="Invalid chapter content JSON")
        
    if payload.step_index < 0 or payload.step_index >= len(content.get("steps", [])):
        raise HTTPException(status_code=400, detail="Invalid step index")
        
    # Generate new audio
    audio_path, duration = await tts_service.generate_audio(payload.text)
    
    if not audio_path:
        raise HTTPException(status_code=500, detail="Failed to generate audio")
        
    # Update JSON
    content["steps"][payload.step_index]["description"] = payload.text
    content["steps"][payload.step_index]["audio_url"] = audio_path
    content["steps"][payload.step_index]["duration"] = duration
    
    # Save to DB
    chapter.text_content = json.dumps(content, ensure_ascii=False)
    await db.commit()
    
    # Return formatted URL (Proxy)
    proxy_url = f"/api/v1/stream?path={audio_path}"
    return {"audio_url": proxy_url, "duration": duration}
