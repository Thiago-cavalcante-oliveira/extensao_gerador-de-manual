import asyncio
from app.services.ai_processor import ai_processor
from app.db.session import AsyncSessionLocal
from app.models import Chapter, Module, System, Collection
from sqlalchemy import select
from app.services.tts import tts_service

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
                print(f"[Worker] Chapter {chapter_id} não encontrado.")
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
            
            print(f"[Worker] Processando vídeo: {chapter.video_url}")
            
            # 2. Chama IA
            result = await ai_processor.analyze_video(
                video_path_minio=chapter.video_url,
                system_context=system_context_str,
                module_context=module_context_str,
                user_goal=user_goal
            )
            
            print(f"[Worker] IA finalizou. Título: {result.get('title')}")

            # 3. Gera Áudio (TTS)
            if "steps" in result:
                print(f"[Worker] Gerando áudio para {len(result['steps'])} passos...")
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
            print(f"[Worker] Job {chapter_id} concluído com sucesso!")

        except Exception as e:
            print(f"[Worker] Erro fatal no job {chapter_id}: {e}")
