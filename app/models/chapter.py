from datetime import datetime
from sqlalchemy import String, ForeignKey, Integer, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Chapter(Base):
    """
    Representa um PASSO ou CAPÍTULO de um manual.
    Ex: "Passo 1: Abrir a tampa frontal"
    """
    __tablename__ = "chapters"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Chave estrangeira ligando ao Guia (Collection)
    collection_id: Mapped[int] = mapped_column(ForeignKey("collections.id"))
    
    title: Mapped[str] = mapped_column(String(200))
    
    # URL do vídeo no MinIO (Bucket 'raw-videos')
    video_url: Mapped[str] = mapped_column(String(500))
    stitched_video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Texto gerado pela IA (e editado pelo humano)
    text_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Metadata para Filtros
    audience: Mapped[str | None] = mapped_column(String(200), nullable=True) # Ex: "Analistas, Gerentes"
    functionality: Mapped[str | None] = mapped_column(String(100), nullable=True) # Ex: "Cadastro de Usuário"

    # Status do processamento: PENDING, DRAFT, PUBLISHED, STITCHING, STITCHED
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relacionamento reverso: Um Passo pertence a um Guia
    collection: Mapped["Collection"] = relationship("Collection", back_populates="chapters")
