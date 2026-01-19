import google.generativeai as genai
from app.core.config import settings
from app.services.storage import storage
import os
import json
import asyncio
import time

class AIProcessor:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        # Usando 'gemini-2.0-flash' (Mais rápido e com cotas melhores)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    async def analyze_video(self, video_path_minio: str, system_context: str = "", module_context: str = "", user_goal: str = "") -> dict:
        """
        1. Baixa vídeo do MinIO
        2. Upload pro Google
        3. Analisa com Prompt Contextualizado
        4. Retorna JSON
        """
        temp_file = f"/tmp/{video_path_minio.split('/')[-1]}"
        
        try:
            # 1. Download
            print(f"Baixando vídeo: {video_path_minio}")
            try:
                storage.download_file(video_path_minio, temp_file)
            except Exception as e:
                # Se falhar o download, não adianta continuar
                print(f"Erro no download do MinIO: {e}")
                raise e
            
            # 2. Otimização: Converter para 1 FPS (Reduz tamanho e custo)
            print("Otimizando vídeo (1 FPS)...")
            optimized_file = temp_file.replace(".webm", "_opt.mp4").replace(".mp4", "_opt.mp4")
            
            import subprocess
            # ffmpeg -i input -r 1 output
            # -y (overwrite), -r 1 (1 frame per sec)
            cmd = [
                "ffmpeg", "-y", 
                "-i", temp_file, 
                "-r", "1", 
                optimized_file
            ]
            
            process = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if process.returncode != 0:
                print(f"Erro no FFmpeg: {process.stderr.decode()}")
                # Fallback: Se falhar, usa o arquivo original mesmo
                final_file_path = temp_file
            else:
                print("Vídeo otimizado com sucesso.")
                final_file_path = optimized_file

            # 3. Upload to Gemini
            print(f"Enviando para o Google ({final_file_path})...")
            video_file = genai.upload_file(path=final_file_path)
            print(f"Upload concluído: {video_file.uri}")
            
            # Aguarda processamento do vídeo no lado do Google
            while video_file.state.name == "PROCESSING":
                print("Aguardando processamento do vídeo no Google...")
                await asyncio.sleep(2)
                video_file = genai.get_file(video_file.name)
                
            if video_file.state.name == "FAILED":
                raise ValueError("Falha no processamento do vídeo pelo Google.")

            # 3. Engenharia de Prompt com Contexto
            prompt = f"""
            Role: Tech Writer Specialist (Senior).
            Context Hierarchy:
            - System Identity: {system_context}
            - Module Context: {module_context}
            
            User Goal (The Manual Title): "{user_goal}"
            
            Task:
            Analyze the provided screen recording video. The user is demonstrating how to achieve the "User Goal".
            Create a step-by-step manual.
            
            Guidelines:
            - Use the System and Module context to identify specific UI elements (e.g., if context says "Blue Header", look for it).
            - Ignore "Alt+Tab" or system switching unless necessary.
            - Be concise but descriptive.
            
            Output Format (Strict JSON):
            {{
                "title": "{user_goal}",
                "steps": [
                    {{
                        "timestamp": "MM:SS",
                        "description": "Action description (e.g. Clicked on 'Save' button)."
                    }}
                ]
            }}
            """
            
            print("Solicitando análise com contexto...")
            response = self.model.generate_content(
                [video_file, prompt],
                generation_config={"response_mime_type": "application/json"}
            )
            
            print("Análise recebida.")
            try:
                return json.loads(response.text)
            except json.JSONDecodeError:
                # Fallback simples se o JSON vier quebrado (markdown block etc)
                print("JSON Inválido recebido, tentando limpar...")
                clean_text = response.text.replace("```json", "").replace("```", "")
                return json.loads(clean_text)

        except Exception as e:
            print(f"Erro na IA: {e}")
            error_str = str(e)
            if "Quota exceeded" in error_str or "429" in error_str or "404" in error_str or "not found" in error_str.lower():
                print("⚠️ Erro na API do Google (Cota ou Modelo). Ativando MOCK MODE Automático.")
                return {
                    "title": "Manual de Teste (Mock AI)",
                    "steps": [
                        {"timestamp": "00:01", "description": "O usuário abriu a tela inicial do sistema."},
                        {"timestamp": "00:05", "description": "Clicou no menu principal 'Cadastros'."},
                        {"timestamp": "00:10", "description": "Selecionou a opção 'Clientes' na lista suspensa."},
                        {"timestamp": "00:15", "description": "Clicou no botão 'Novo' para adicionar um registro."},
                        {"timestamp": "00:20", "description": "Preencheu o campo 'Nome' com 'Empresa Modelo LTDA'."},
                        {"timestamp": "00:25", "description": "Clicou em 'Salvar' e o sistema confirmou a operação."}
                    ]
                }
            raise e
        finally:
            # Limpeza
            if os.path.exists(temp_file):
                os.remove(temp_file)
            # Remove arquivo otimizado também, se existir
            opt_file = temp_file.replace(".webm", "_opt.mp4").replace(".mp4", "_opt.mp4")
            if os.path.exists(opt_file):
                os.remove(opt_file)
            # Todo: Deletar arquivo do Google (genai.delete_file(video_file.name))

ai_processor = AIProcessor()
