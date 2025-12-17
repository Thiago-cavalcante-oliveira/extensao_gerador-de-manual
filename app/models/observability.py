from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.db.base import Base
from datetime import datetime

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    video_id: Mapped[str] = mapped_column(String, index=True) # ID do arquivo no MinIO ou similar
    status: Mapped[str] = mapped_column(String, default="pending") # pending, processing, completed, failed
    model_used: Mapped[str] = mapped_column(String, nullable=True) # gemini-1.5-flash
    tokens_input: Mapped[int] = mapped_column(Integer, default=0)
    tokens_output: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    error_log: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String, nullable=True) # IP ou User Agent por enquanto (Auth futuramente)
    action: Mapped[str] = mapped_column(String, nullable=False) # VIEW, CREATE, EDIT, DELETE
    resource_type: Mapped[str] = mapped_column(String, nullable=False) # Manual, Video, System
    resource_id: Mapped[str] = mapped_column(String, nullable=True)
    details: Mapped[str] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    manual_id: Mapped[str] = mapped_column(String, index=True)
    is_positive: Mapped[bool] = mapped_column(Boolean, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
