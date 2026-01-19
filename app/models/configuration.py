from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Boolean, JSON, Text
from app.db.base import Base

class Configuration(Base):
    """
    Tabela Singleton para armazenar configurações globais da aplicação.
    Deverá ter apenas 1 registro (ID=1).
    """
    __tablename__ = "configurations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # 🎨 Identity / Branding
    primary_color: Mapped[str] = mapped_column(String, default="#0099ff")
    secondary_color: Mapped[str] = mapped_column(String, default="#2b8a3e")
    logo_url: Mapped[str] = mapped_column(String, nullable=True) # URL ou Base64
    
    # 🎥 Recorder / Extension Configs
    blur_intensity: Mapped[int] = mapped_column(Integer, default=6) # 0-20px
    mask_style: Mapped[str] = mapped_column(String, default="dots") # dots, solid, ...
    privacy_default_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # ℹ️ Tutorials & Tooltips (Texto flexível)
    # Ex: {"mask_btn_tooltip": "Ajuda...", "start_tooltip": "..."}
    tooltips: Mapped[dict] = mapped_column(JSON, default={})

    # 🎬 Branding Assets
    intro_video_url: Mapped[str | None] = mapped_column(String, nullable=True)
    outro_video_url: Mapped[str | None] = mapped_column(String, nullable=True)
