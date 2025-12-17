from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models import System, Module
from pydantic import BaseModel

router = APIRouter()

# Schemas Pydantic (DTOs)
class ModuleResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class SystemResponse(BaseModel):
    id: int
    name: str
    modules: list[ModuleResponse] = []

    class Config:
        from_attributes = True

@router.get("/systems", response_model=list[SystemResponse])
async def list_systems(db: AsyncSession = Depends(get_db)):
    """
    Lista todos os sistemas e seus módulos.
    Usado pela Extensão do Chrome para popular o dropdown.
    """
    # Eager Load para trazer os módulos junto
    from sqlalchemy.orm import selectinload
    result = await db.execute(select(System).options(selectinload(System.modules)))
    systems = result.scalars().all()
    return systems
