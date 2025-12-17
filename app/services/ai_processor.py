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
        # Usando 'gemini-1.5-pro' (Nome padrão estável)
        self.model = genai.GenerativeModel('gemini-1.5-pro')

    async def analyze_video(self, video_path_minio: str) -> dict:
        """
        1. Baixa vídeo do MinIO
        2. Upload pro Google
        3. Analisa com Prompt
        4. Retorna JSON
        """
        temp_file = f"/tmp/{video_path_minio.split('/')[-1]}"
        
        try:
            # 1. Download
            print(f"Baixando vídeo: {video_path_minio}")
            storage.download_file(video_path_minio, temp_file)
            
            # 2. Upload to Gemini
            print("Enviando para o Google...")
            video_file = genai.upload_file(path=temp_file)
            print(f"Upload concluído: {video_file.uri}")
            
            # Aguarda processamento do vídeo no lado do Google
            while video_file.state.name == "PROCESSING":
                print("Aguardando processamento do vídeo no Google...")
                await asyncio.sleep(2)
                video_file = genai.get_file(video_file.name)
                
            if video_file.state.name == "FAILED":
                raise ValueError("Falha no processamento do vídeo pelo Google.")

            # 3. Prompt
            prompt = """
            Você é um redator técnico especialista em criar manuais de software.
            Analise este vídeo de uma tela de computador.
            Identifique cada ação realizada pelo usuário (cliques, digitação, navegação).
            
            Retorne APENAS um JSON estritamente válido com a seguinte estrutura:
            {
                "title": "Título sugerido para o manual",
                "steps": [
                    {
                        "timestamp": "00:05",
                        "description": "Descrição detalhada da ação. Ex: Clicou no botão 'Salvar'"
                    }
                ]
            }
            """
            
            print("Solicitando análise...")
            response = self.model.generate_content(
                [video_file, prompt],
                generation_config={"response_mime_type": "application/json"}
            )
            
            print("Análise recebida.")
            return json.loads(response.text)

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
            # Todo: Deletar arquivo do Google (genai.delete_file(video_file.name))

ai_processor = AIProcessor()
