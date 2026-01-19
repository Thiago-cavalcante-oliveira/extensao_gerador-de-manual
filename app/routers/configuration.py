from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.db.session import get_db
from app.models.configuration import Configuration

router = APIRouter()

# --- Schemas ---
class ConfigurationBase(BaseModel):
    primary_color: str = "#0099ff"
    secondary_color: str = "#2b8a3e"
    logo_url: Optional[str] = None
    blur_intensity: int = 6
    mask_style: str = "dots"
    privacy_default_enabled: bool = False
    tooltips: Dict[str, Any] = {}
    intro_video_url: Optional[str] = None
    outro_video_url: Optional[str] = None

class ConfigurationResponse(ConfigurationBase):
    id: int
    
    class Config:
        from_attributes = True

class ConfigurationUpdate(ConfigurationBase):
    pass

# --- Endpoints ---

@router.get("/configuration", response_model=ConfigurationResponse)
async def get_configuration(db: AsyncSession = Depends(get_db)):
    """
    Retorna a configuração global. Cria uma padrão se não existir.
    """
    result = await db.execute(select(Configuration).where(Configuration.id == 1))
    config = result.scalars().first()
    
    if not config:
        # Auto-create defaults
        config = Configuration(id=1)
        db.add(config)
        await db.commit()
        await db.refresh(config)
        
    return config

@router.put("/configuration", response_model=ConfigurationResponse)
async def update_configuration(config_in: ConfigurationUpdate, db: AsyncSession = Depends(get_db)):
    """
    Atualiza a configuração global (ID=1).
    """
    result = await db.execute(select(Configuration).where(Configuration.id == 1))
    config = result.scalars().first()
    
    if not config:
        # Create if missing (should be rare if GET called first)
        config = Configuration(id=1)
        db.add(config)
    
    # Update fields
    config.primary_color = config_in.primary_color
    config.secondary_color = config_in.secondary_color
    config.logo_url = config_in.logo_url
    config.blur_intensity = config_in.blur_intensity
    config.mask_style = config_in.mask_style
    config.privacy_default_enabled = config_in.privacy_default_enabled
    config.tooltips = config_in.tooltips
    
    # Do not update intro/outro urls here, handled by specific upload endpoints
    # or expose them if manual URL entry is allowed? For now, keep separate.
    
    await db.commit()
    await db.refresh(config)
    return config

# --- File Uploads ---
from fastapi import UploadFile, File
from app.services.storage import storage
import os
import uuid

@router.post("/configuration/assets/{asset_type}")
async def upload_asset(
    asset_type: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads an asset (intro, outro, logo).
    asset_type: "intro", "outro", "logo"
    """
    if asset_type not in ["intro", "outro", "logo"]:
        raise HTTPException(status_code=400, detail="Invalid asset type")
    
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if asset_type == "logo" and ext not in [".png", ".jpg", ".jpeg", ".svg"]:
         raise HTTPException(status_code=400, detail="Logos must be images")
    if asset_type in ["intro", "outro"] and ext not in [".mp4", ".mov"]:
         raise HTTPException(status_code=400, detail="Videos must be mp4 or mov")
         
    # Upload to MinIO
    filename = f"assets/{asset_type}_{uuid.uuid4()}{ext}"
    
    # Save temp
    import tempfile
    import shutil
    
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
        
    import traceback
    try:
        await storage.upload_file(tmp_path, filename, content_type=file.content_type)
    except Exception as e:
        print(f"UPLOAD ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload asset: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
    
    # Update DB
    try:
        result = await db.execute(select(Configuration).where(Configuration.id == 1))
        config = result.scalars().first()
        if not config:
            config = Configuration(id=1)
            db.add(config)
        
        if asset_type == "intro":
            config.intro_video_url = filename
        elif asset_type == "outro":
            config.outro_video_url = filename
        elif asset_type == "logo":
            config.logo_url = filename
            
        await db.commit()
    except Exception as e:
        print(f"DB UPDATE ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update configuration: {str(e)}")
    
    return {"url": filename, "type": asset_type}
