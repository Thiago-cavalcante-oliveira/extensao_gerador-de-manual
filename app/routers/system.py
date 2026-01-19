from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models import System, Module
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# --- Schemas ---

class ModuleCreate(BaseModel):
    name: str
    context_prompt: Optional[str] = None

class ModuleUpdate(BaseModel):
    name: Optional[str] = None
    context_prompt: Optional[str] = None

class ModuleResponse(BaseModel):
    id: int
    system_id: int
    name: str
    context_prompt: Optional[str] = None

    class Config:
        from_attributes = True

class SystemCreate(BaseModel):
    name: str
    context_prompt: Optional[str] = None
    icon: Optional[str] = "building" # Default icon

class SystemUpdate(BaseModel):
    name: Optional[str] = None
    context_prompt: Optional[str] = None
    icon: Optional[str] = None

class SystemResponse(BaseModel):
    id: int
    name: str
    context_prompt: Optional[str] = None
    # We might add icon here if we update the model, but for now lets rely on existing model or just not error if it's missing from DB schema yet.
    # The current System model doesn't have 'icon'. We should check if we need to add it or just mock it.
    # The frontend expects 'icon'. I will add it to DB if I can, or just return default.
    # Analyzing previous model file `system.py`:
    # class System(Base): ... name, context_prompt. NO ICON.
    # So I will return a hardcoded/mock icon or add column. 
    # For MVP safety without migration complexity, I'll stick to model but add 'icon' to response (mock/hardcoded).
    icon: str = "building" # Mock return for now since DB column doesn't exist
    modules: List[ModuleResponse] = []

    class Config:
        from_attributes = True

# --- Endpoints: Systems ---

@router.get("/systems", response_model=List[SystemResponse])
async def list_systems(db: AsyncSession = Depends(get_db)):
    """Lista todos os sistemas cadastrados com seus módulos."""
    query = await db.execute(
        select(System).options(selectinload(System.modules)).order_by(System.name)
    )
    systems = query.scalars().all()
    # Pydantic handles the nested 'modules' conversion if names match
    return systems

@router.post("/systems", response_model=SystemResponse)
async def create_system(payload: SystemCreate, db: AsyncSession = Depends(get_db)):
    """Cria um novo sistema."""
    new_system = System(
        name=payload.name,
        context_prompt=payload.context_prompt,
        # icon=payload.icon # Column doesn't exist yet, we ignore it or need migration
    )
    db.add(new_system)
    await db.commit()
    await db.refresh(new_system)
    return new_system

@router.put("/systems/{system_id}", response_model=SystemResponse)
async def update_system(system_id: int, payload: SystemUpdate, db: AsyncSession = Depends(get_db)):
    """Atualiza um sistema existente."""
    system = await db.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    
    if payload.name:
        system.name = payload.name
    if payload.context_prompt is not None:
        system.context_prompt = payload.context_prompt
    
    await db.commit()
    await db.refresh(system)
    
    # Reload modules for response
    # We need to explicitly load relationship if we want to return full object
    # Or rely on lazy loading (async requires eager though)
    await db.refresh(system, attribute_names=["modules"])
    return system

@router.delete("/systems/{system_id}")
async def delete_system(system_id: int, db: AsyncSession = Depends(get_db)):
    """Deleta um sistema e seus módulos em cascata."""
    system = await db.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    
    await db.delete(system)
    await db.commit()
    return {"ok": True}

# --- Endpoints: Modules ---

@router.post("/systems/{system_id}/modules", response_model=ModuleResponse)
async def create_module(system_id: int, payload: ModuleCreate, db: AsyncSession = Depends(get_db)):
    """Cria um módulo dentro de um sistema."""
    # Check system
    system = await db.get(System, system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
        
    new_module = Module(
        system_id=system_id,
        name=payload.name,
        context_prompt=payload.context_prompt
    )
    db.add(new_module)
    await db.commit()
    await db.refresh(new_module)
    return new_module

@router.put("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(module_id: int, payload: ModuleUpdate, db: AsyncSession = Depends(get_db)):
    """Atualiza um módulo."""
    module = await db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    if payload.name:
        module.name = payload.name
    if payload.context_prompt is not None:
        module.context_prompt = payload.context_prompt
        
    await db.commit()
    await db.refresh(module)
    return module

@router.delete("/modules/{module_id}")
async def delete_module(module_id: int, db: AsyncSession = Depends(get_db)):
    """Deleta um módulo."""
    module = await db.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    await db.delete(module)
    await db.commit()
    return {"ok": True}
