from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models import System, Module
from pydantic import BaseModel

router = APIRouter()

# Schemas Pydantic (DTOs)
# Schemas Pydantic (DTOs)
class ModuleResponse(BaseModel):
    id: int
    name: str
    context_prompt: str | None = None

    class Config:
        from_attributes = True

class SystemResponse(BaseModel):
    id: int
    name: str
    context_prompt: str | None = None
    modules: list[ModuleResponse] = []

    class Config:
        from_attributes = True

class SystemCreate(BaseModel):
    name: str
    context_prompt: str | None = None

class SystemUpdate(BaseModel):
    name: str | None = None
    context_prompt: str | None = None

class ModuleCreate(BaseModel):
    name: str
    context_prompt: str | None = None

class ModuleUpdate(BaseModel):
    name: str | None = None
    context_prompt: str | None = None

@router.get("/systems", response_model=list[SystemResponse])
async def list_systems(db: AsyncSession = Depends(get_db)):
    """
    Lista todos os sistemas e seus módulos.
    Usado pela Extensão do Chrome para popular o dropdown.
    """
    # Eager Load para trazer os módulos junto
    from sqlalchemy.orm import selectinload
    result = await db.execute(select(System).options(selectinload(System.modules)).order_by(System.id))
    systems = result.scalars().all()
    return systems

@router.post("/systems", response_model=SystemResponse)
async def create_system(system: SystemCreate, db: AsyncSession = Depends(get_db)):
    """Cria um novo Sistema."""
    db_system = System(name=system.name, context_prompt=system.context_prompt)
    db.add(db_system)
    await db.commit()
    await db.refresh(db_system)
    return db_system

@router.put("/systems/{system_id}", response_model=SystemResponse)
async def update_system(system_id: int, system_in: SystemUpdate, db: AsyncSession = Depends(get_db)):
    """Atualiza um Sistema."""
    result = await db.execute(select(System).where(System.id == system_id).options(selectinload(System.modules)))
    db_system = result.scalar_one_or_none()
    
    if not db_system:
        raise HTTPException(status_code=404, detail="System not found")
    
    if system_in.name is not None:
        db_system.name = system_in.name
    if system_in.context_prompt is not None:
        db_system.context_prompt = system_in.context_prompt
        
    await db.commit()
    await db.refresh(db_system)
    return db_system

@router.delete("/systems/{system_id}")
async def delete_system(system_id: int, db: AsyncSession = Depends(get_db)):
    """Remove um Sistema e seus Módulos (Cascade)."""
    result = await db.execute(select(System).where(System.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    
    await db.delete(system)
    await db.commit()
    return {"ok": True}

@router.post("/systems/{system_id}/modules", response_model=ModuleResponse)
async def create_module(system_id: int, module: ModuleCreate, db: AsyncSession = Depends(get_db)):
    """Adiciona um Módulo a um Sistema."""
    # Verify system exists
    result = await db.execute(select(System).where(System.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    
    db_module = Module(name=module.name, context_prompt=module.context_prompt, system_id=system_id)
    db.add(db_module)
    await db.commit()
    await db.refresh(db_module)
    return db_module

@router.put("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(module_id: int, module_in: ModuleUpdate, db: AsyncSession = Depends(get_db)):
    """Atualiza um Módulo."""
    result = await db.execute(select(Module).where(Module.id == module_id))
    db_module = result.scalar_one_or_none()
    
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    if module_in.name is not None:
        db_module.name = module_in.name
    if module_in.context_prompt is not None:
        db_module.context_prompt = module_in.context_prompt
        
    await db.commit()
    await db.refresh(db_module)
    return db_module

@router.delete("/modules/{module_id}")
async def delete_module(module_id: int, db: AsyncSession = Depends(get_db)):
    """Remove um Módulo."""
    result = await db.execute(select(Module).where(Module.id == module_id))
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    await db.delete(module)
    await db.commit()
    return {"ok": True}
