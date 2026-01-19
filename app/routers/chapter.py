from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models import Chapter, Collection, Module, System
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter()

@router.post("/chapters/{chapter_id}/reprocess")
async def reprocess_chapter(
    chapter_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Retriggers the AI analysis for an existing video.
    Useful if the previous attempt failed due to API errors.
    """
    chapter = await db.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Reset status
    chapter.status = "PENDING"
    # Optional: Clear previous error content if you want
    await db.commit()
    
    # Trigger Worker
    from app.services.worker import process_video_job
    background_tasks.add_task(process_video_job, chapter.id, "Criar um manual passo a passo detalhado.")
    print(f"DEBUG: Reprocess triggering for {chapter_id}")
    return {"message": "Reprocessing started", "status": "PENDING"}

@router.post("/chapters/{chapter_id}/cancel")
async def cancel_chapter(
    chapter_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancels the AI processing by forcing status to FAILED (or DRAFT).
    Does not stop the actual thread if running, but updates DB so UI stops polling.
    """
    chapter = await db.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    chapter.status = "FAILED"
    # Optional: Update content to explain cancel
    import json
    chapter.text_content = json.dumps({"error": "Cancelled by user"})
    
    await db.commit()
    return {"message": "Processing cancelled", "status": "FAILED"}

from app.services.video_processor import video_processor
from app.models.configuration import Configuration

async def background_stitch_and_publish(chapter_id: int, db_session_factory):
    # Create a new session for the background task
    async with db_session_factory() as db:
        chapter = await db.get(Chapter, chapter_id)
        if not chapter: return
        
        # Get Config
        config = await db.scalar(select(Configuration).limit(1))
        intro = config.intro_video_url if config else None
        outro = config.outro_video_url if config else None
        
        try:
            # Stitch
            if intro or outro:
                print(f"Stitching chapter {chapter_id} with intro={intro}, outro={outro}")
                final_url = await video_processor.stitch_videos(chapter.video_url, intro, outro)
                chapter.stitched_video_url = final_url
                chapter.video_url = final_url # Update main URL to pointed to stitched? Or keep raw?
                # User asked: "inserido no vídeo automaticamente". 
                # Let's update `video_url` to be the stitched one so the player plays the final version.
                # But keep `stitched_video_url` just in case we want to revert/debug.
            
            chapter.status = "COMPLETED"
            await db.commit()
            print(f"Chapter {chapter_id} published successfully.")
            
        except Exception as e:
            print(f"Stitching failed: {e}")
            chapter.status = "FAILED" # Or revert to draft?
            await db.commit()

@router.post("/chapters/{chapter_id}/publish")
async def publish_chapter(
    chapter_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Marks a chapter as PUBLISHED.
    Triggers automatic stitching if Intro/Outro are configured.
    """
    chapter = await db.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Check if stitching is needed
    config = await db.scalar(select(Configuration).limit(1))
    has_assets = config and (config.intro_video_url or config.outro_video_url)
    
    if has_assets:
        chapter.status = "PROCESSING" # Use PROCESSING to show spinner in UI
        await db.commit()
        
        # We need to pass a session factory or handle session inside background task
        # app.db.session.AsyncSessionLocal is what we need
        from app.db.session import AsyncSessionLocal
        background_tasks.add_task(background_stitch_and_publish, chapter_id, AsyncSessionLocal)
        
        return {"message": "Publishing process started (Stitching)", "status": "PROCESSING"}
    else:
        # Instant publish if no intro/outro
        chapter.status = "COMPLETED"
        await db.commit()
        return {"message": "Chapter published", "status": "COMPLETED"}

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
    
    # Viewer Metadata
    audience: str | None = None
    functionality: str | None = None
    is_favorite: bool = False

    class Config:
        from_attributes = True

from app.services.storage import storage

from app.models import Chapter, Collection, Module, System, Favorite
from pydantic import BaseModel
from typing import Optional

# ... (Previous imports)

@router.post("/chapters/{chapter_id}/favorite")
async def toggle_favorite(
    chapter_id: int,
    user_id: int = 1, # Default to ID 1 for MVP (Admin)
    db: AsyncSession = Depends(get_db)
):
    """
    Toggles the favorite status for a chapter.
    """
    try:
        # Check if exists
        stmt = select(Favorite).where(
            Favorite.user_id == user_id, 
            Favorite.chapter_id == chapter_id
        )
        result = await db.execute(stmt)
        fav = result.scalar_one_or_none()
        
        if fav:
            await db.delete(fav)
            is_fav = False
        else:
            fav = Favorite(user_id=user_id, chapter_id=chapter_id)
            db.add(fav)
            is_fav = True
            
        await db.commit()
        return {"ok": True, "is_favorite": is_fav}
    except Exception as e:
        print(f"ERROR toggling favorite: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chapters", response_model=list[ChapterResponse])
async def list_chapters(
    audience: Optional[str] = None,
    functionality: Optional[str] = None,
    only_favorites: bool = False,
    published_only: bool = False,
    user_id: int = 1, # Context user
    db: AsyncSession = Depends(get_db)
):
    """
    Lista capítulos com filtros opcionais.
    published_only=True retorna apenas COMPLETED.
    """
    
    # Base query
    stmt = (
        select(Chapter)
        .options(
            selectinload(Chapter.collection).selectinload(Collection.module).selectinload(Module.system)
        )
        .order_by(Chapter.created_at.desc())
    )
    
    # Filters
    if published_only:
        stmt = stmt.where(Chapter.status == "COMPLETED")

    if audience:
        # Simple flexible search
        stmt = stmt.where(Chapter.audience.ilike(f"%{audience}%"))
        
    if functionality:
        stmt = stmt.where(Chapter.functionality.ilike(f"%{functionality}%"))
        
    if only_favorites:
        stmt = stmt.join(Favorite, Chapter.id == Favorite.chapter_id).where(Favorite.user_id == user_id)
        
    result = await db.execute(stmt)
    chapters = result.scalars().all()
    
    # Check favorites for response flags? (Optional, if UI needs to show HEART filled)
    # For efficiency we could join, but N+1 query for MVP list is acceptable or separate set.
    # Let's verify favorites for the current list to set a flag in response?
    # ChapterResponse doesn't have 'is_favorite' field yet. 
    # I should add it to ChapterResponse.
    
    # Get user favorites IDs
    fav_stmt = select(Favorite.chapter_id).where(Favorite.user_id == user_id)
    fav_res = await db.execute(fav_stmt)
    fav_ids = set(fav_res.scalars().all())

    # Transformar para o DTO achatado
    response = []
    for chap in chapters:
        sys_name = None
        mod_name = None
        if chap.collection and chap.collection.module:
            mod_name = chap.collection.module.name
            if chap.collection.module.system:
                sys_name = chap.collection.module.system.name
        
        # Gera URL assinada (Prefer use stitched if available for Viewer?)
        # Logic: If stitched exists and status COMPLETED, prefer it?
        # User request: "editar vídeo... visualizar vídeos publicados"
        # Since this is list_chapters (used by Admin too), maybe keep raw `video_url`.
        # But for "Viewer" we want final.
        # Let's prioritize stitched_video_url if status is COMPLETED.
        
        final_url = chap.video_url
        if chap.status == "COMPLETED" and chap.stitched_video_url:
             final_url = chap.stitched_video_url
             
        full_video_url = storage.get_presigned_url(final_url)
        
        response.append(ChapterResponse(
            id=chap.id,
            title=chap.title,
            video_url=full_video_url,
            status=chap.status,
            created_at=chap.created_at,
            system_name=sys_name,
            module_name=mod_name,
            audience=getattr(chap, 'audience', None),           # Add to Response Model
            functionality=getattr(chap, 'functionality', None), # Add to Response Model
            is_favorite=(chap.id in fav_ids)                    # Add to Response Model
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
