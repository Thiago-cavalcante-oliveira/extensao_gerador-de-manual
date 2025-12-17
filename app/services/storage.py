from datetime import timedelta
from minio import Minio
from minio.error import S3Error
from app.core.config import settings
import io

class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket_name = settings.MINIO_BUCKET_RAW
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Verifica se o bucket existe, se não, cria."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"Bucket '{self.bucket_name}' criado com sucesso.")
        except S3Error as e:
            print(f"Erro ao verificar/criar bucket: {e}")

    def save_video(self, file_data: bytes, filename: str, content_type: str) -> str:
        """
        Envia o arquivo para o MinIO e retorna a URL (ou path).
        """
        try:
            # Converte bytes para stream (file-like object)
            file_stream = io.BytesIO(file_data)
            
            self.client.put_object(
                self.bucket_name,
                filename,
                file_stream,
                length=len(file_data),
                content_type=content_type
            )
            
            # Monta a URL de acesso (assumindo bucket público ou uso interno)
            # Para simplificar, retornamos o path relativo (bucket/arquivo)
            # ou a URL completa se preferir.
            return f"{self.bucket_name}/{filename}"
            
        except S3Error as e:
            print(f"Erro ao salvar no MinIO: {e}")
            raise e

    def download_file(self, object_name: str, dest_path: str):
        """Baixa um arquivo do MinIO para o disco local."""
        try:
            # object_name pode vir como 'bucket/arquivo.ext', precisamos só do 'arquivo.ext'
            # se estivermos usando sempre o self.bucket_name
            actual_object_name = object_name.split("/")[-1]
            
            self.client.fget_object(
                self.bucket_name,
                actual_object_name,
                dest_path
            )
            return dest_path
        except S3Error as e:
            print(f"Erro ao baixar do MinIO: {e}")
            raise e

    def get_presigned_url(self, filename: str, expiration_seconds: int = 3600) -> str:
        """Gera uma URL temporária assinada para visualização."""
        try:
            # Se o filename vier com o bucket (formato antigo/hardcoded), remove
            # Ex: documentacao/arquivo.webm -> arquivo.webm
            if "/" in filename:
                filename = filename.split("/")[-1]

            url = self.client.presigned_get_object(
                self.bucket_name,
                filename,
                expires=timedelta(seconds=expiration_seconds)
            )
            
            # Hack para desenvolvimento local (Docker -> Browser)
            # O container vê 'minio' ou 'host.docker.internal', mas o browser quer 'localhost'
            return url.replace("minio:9000", "localhost:9000").replace("host.docker.internal:9000", "localhost:9000")
        except S3Error as e:
            print(f"Erro ao gerar URL assinada: {e}")
            return ""

# Instância única
storage = StorageService()
