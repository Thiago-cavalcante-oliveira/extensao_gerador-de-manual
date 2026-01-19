import asyncio
import logging
import os
from app.services.ai_processor import ai_processor
from app.db.session import AsyncSessionLocal
from app.models import Chapter, Module, System, Collection
from sqlalchemy import select
from app.services.tts import tts_service

# Configure logging
log_dir = "logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Configure logging
log_dir = "logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Create a custom logger
logger = logging.getLogger("app.services.worker")
logger.setLevel(logging.INFO)

# Create handlers
f_handler = logging.FileHandler(os.path.join(log_dir, 'worker.log'))
f_handler.setLevel(logging.INFO)

# Create formatters and add it to handlers
f_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
f_handler.setFormatter(f_format)

# Add handlers to the logger
if not logger.handlers:
    logger.addHandler(f_handler)

async def process_video_job(chapter_id: int, user_goal: str):
    """
    Background Task que orquestra a IA.
    Recebe o ID do Capítulo (Video recém criado) e o Objetivo do Usuário.
    """
    print(f"[Worker] Iniciando job para Chapter ID: {chapter_id}")
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Busca dados completos com relacionamentos para obter o Contexto
            from sqlalchemy.orm import selectinload
            stmt = (
                select(Chapter)
                .where(Chapter.id == chapter_id)
                .options(
                    selectinload(Chapter.collection)
                    .selectinload(Collection.module)
                    .selectinload(Module.system)
                )
            )
            result = await db.execute(stmt)
            chapter = result.scalar_one_or_none()
            
            if not chapter:
                logger.warning(f"Chapter {chapter_id} não encontrado.")
                return
            
            # Recupera Contextos da Hierarquia
            system_context_str = ""
            module_context_str = ""
            
            if chapter.collection and chapter.collection.module:
                mod = chapter.collection.module
                module_context_str = mod.context_prompt or f"Module Name: {mod.name}"
                
                if mod.system:
                    sys = mod.system
                    system_context_str = sys.context_prompt or f"System Name: {sys.name}"
            
            logger.info(f"Processando vídeo: {chapter.video_url}")
            
            # 2. Chama IA
            result = await ai_processor.analyze_video(
                video_path_minio=chapter.video_url,
                system_context=system_context_str,
                module_context=module_context_str,
                user_goal=user_goal
            )
            
            logger.info(f"IA finalizou. Título: {result.get('title')}")

            # 3. Gera Áudio (TTS)
            if "steps" in result:
                logger.info(f"Gerando áudio para {len(result['steps'])} passos...")
                for step in result["steps"]:
                    description = step.get("description", "")
                    if description:
                        audio_url, duration = await tts_service.generate_audio(description)
                        step["audio_url"] = audio_url
                        step["duration"] = duration

            # 4. Salva Resultado Final
            import json
            chapter.text_content = json.dumps(result, ensure_ascii=False)
            chapter.status = "DRAFT" # Pronto para workbench
            
            await db.commit()
            logger.info(f"Job {chapter_id} concluído com sucesso!")

        except Exception as e:
            logger.error(f"Erro fatal no job {chapter_id}: {e}", exc_info=True)
            try:
                # Persist error state so we can debug via DB/Frontend
                import json
                chapter.status = "FAILED"
                chapter.text_content = json.dumps({
                    "error": "Processing Failed",
                    "details": str(e)
                }, ensure_ascii=False)
                await db.commit()
            except Exception as db_err:
                print(f"[Worker] Falha ao salvar estado de erro no DB: {db_err}")
