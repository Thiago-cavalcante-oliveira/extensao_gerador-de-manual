from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.db.session import get_db
from app.models.observability import AuditLog, ProcessingJob
from app.models.collection import Collection
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# --- Schemas ---

class AuditLogResponse(BaseModel):
    id: int
    action: str
    entity: str # Mapped from resource_type + resource_id (simplified for UI) or just resource_type
    user: str # user_id
    timestamp: datetime
    severity: str = "info" # Mock for now or derived from action
    details: str | None = None
    ip: str | None = None

    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    total_manuals: int
    weekly_growth: int
    attention_needed: int
    processing_count: int
    total_views: int

# --- Endpoints ---

@router.get("/audit-logs", response_model=list[AuditLogResponse])
async def list_audit_logs(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Lista logs de auditoria recentes."""
    # In a real app we might join with User table, but here we just return the log
    query = await db.execute(
        select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit)
    )
    logs = query.scalars().all()
    
    # Mapper simples para o frontend
    response = []
    for log in logs:
        # Determine severity based on action
        severity = "info"
        if log.action in ["DELETE", "CRITICAL"]: severity = "critical"
        elif log.action in ["UPDATE", "EDIT"]: severity = "info"
        elif log.action == "CREATE": severity = "success"
        elif "FAIL" in log.action: severity = "warning"
        
        response.append(AuditLogResponse(
            id=log.id,
            action=log.action,
            entity=f"{log.resource_type}",
            user=log.user_id or "System",
            timestamp=log.timestamp,
            severity=severity,
            details=log.details,
            ip="127.0.0.1" # Mock
        ))
    
    return response

@router.get("/analytics/stats", response_model=StatsResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Retorna estatísticas para os cards do Dashboard."""
    
    # 1. Total Manuals (Collections)
    total_manuals = await db.scalar(select(func.count(Collection.id))) or 0
    
    # 2. Weekly Growth (Last 7 days)
    # TODO: Implement date filter query. For now mock 0 or minimal logic.
    weekly_growth = 0 

    # 3. Processing (ProcessingJob status='processing')
    processing_count = await db.scalar(select(func.count(ProcessingJob.id)).where(ProcessingJob.status == 'processing')) or 0
    
    # 4. Attention Needed (Outdated/Failed jobs?)
    attention_needed = await db.scalar(select(func.count(ProcessingJob.id)).where(ProcessingJob.status == 'failed')) or 0
    
    # 5. Total Views (AuditLog action='VIEW')
    total_views = await db.scalar(select(func.count(AuditLog.id)).where(AuditLog.action == 'VIEW_MANUAL')) or 0
    
    return StatsResponse(
        total_manuals=total_manuals,
        weekly_growth=weekly_growth,
        attention_needed=attention_needed,
        processing_count=processing_count,
        total_views=total_views
    )
