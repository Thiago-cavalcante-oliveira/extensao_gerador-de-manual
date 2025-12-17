from datetime import datetime
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # [NEW] Link com Módulo (Hierarquia)
    module_id: Mapped[int | None] = mapped_column(ForeignKey("modules.id"), nullable=True) # Nullable true temporário para não quebrar hard se tiver dados orfãos, mas na pratica vai ser limpo
    
    title: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relacionamentos
    module: Mapped["Module"] = relationship("Module", back_populates="collections")
    # cascade="all, delete-orphan": Se apagar o Guia, apaga todos os passos dele.
    chapters: Mapped[list["Chapter"]] = relationship(
        "Chapter", back_populates="collection", cascade="all, delete-orphan"
    )
