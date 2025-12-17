from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text
from app.db.base import Base

class System(Base):
    __tablename__ = "systems"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    context_prompt: Mapped[str] = mapped_column(Text, nullable=True)  # Contexto global do sistema para a IA
    
    # 1 Sistema tem N Módulos
    modules = relationship("Module", back_populates="system", cascade="all, delete-orphan")
