import edge_tts
from app.services.storage import storage
import uuid
import os

class TTSService:
    async def generate_audio(self, text: str, voice: str = "pt-BR-FranciscaNeural") -> str:
        """
        Gera áudio a partir do texto usando Microsoft Edge TTS (Melhor qualidade).
        Fallback: Se falhar, usa gTTS (Google Translate TTS - Mais robótico, mas garantido).
        Salva no MinIO e retorna o caminho.
        """
        if not text:
            return None

        # Arquivo temporário local
        temp_filename = f"{uuid.uuid4()}.mp3"
        temp_path = f"/tmp/{temp_filename}"
        
        try:
            # Tenta Edge TTS Primeiro
            print("TTS: Tentando Edge-TTS...")
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(temp_path)
        except Exception as e:
            print(f"⚠️ Edge-TTS falhou ({e}). Ativando Fallback para gTTS...")
            try:
                # Fallback: gTTS
                from gtts import gTTS
                tts = gTTS(text=text, lang='pt', slow=False)
                tts.save(temp_path)
                print("TTS: Gerado via gTTS (Fallback).")
            except Exception as e2:
                print(f"❌ Erro fatal no TTS (nem gTTS salvou): {e2}")
                return None

        try:
            # Lê os bytes
            with open(temp_path, "rb") as f:
                file_data = f.read()
            
            # Salva no MinIO
            minio_path = f"audio/{temp_filename}"
            # Usa 'audio/mpeg' para garantir que toque no navegador
            saved_path = storage.save_video(file_data, minio_path, "audio/mpeg")
            
            print(f"Áudio salvo no MinIO: {saved_path}")
            return saved_path

        except Exception as e:
            print(f"Erro ao salvar áudio no Storage: {e}")
            return None
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

tts_service = TTSService()
