from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Classe de Configuração Central.
    Lê as variáveis de ambiente do arquivo .env automaticamente.
    """
    # Banco de Dados
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """Monta a URL de conexão no formato que o SQLAlchemy espera."""
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # MinIO
    MINIO_ENDPOINT: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET_RAW: str
    MINIO_SECURE: bool
    
    # Google AI
    GOOGLE_API_KEY: str
    
    # API
    API_PORT: int = 8000
    ENVIRONMENT: str = "development"

    # Configuração do Pydantic para ler do .env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Instância única para ser importada em outros arquivos
settings = Settings()
