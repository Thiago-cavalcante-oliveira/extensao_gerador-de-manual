from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey
from app.db.base import Base

class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    system_id: Mapped[int] = mapped_column(ForeignKey("systems.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    context_prompt: Mapped[str] = mapped_column(Text, nullable=True)  # Contexto específico do módulo
    
    # Relacionamentos
    system = relationship("System", back_populates="modules")
    collections = relationship("Collection", back_populates="module", cascade="all, delete-orphan")
