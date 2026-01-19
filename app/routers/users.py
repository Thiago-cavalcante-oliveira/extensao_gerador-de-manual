from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User, UserRole
from pydantic import BaseModel, EmailStr

router = APIRouter()

# --- Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.READER
    is_active: bool = True

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/users", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    """Lista todos os usuários."""
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()

@router.post("/users", response_model=UserResponse)
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Cria um novo usuário."""
    # Check if email exists
    query = await db.execute(select(User).where(User.email == user_in.email))
    if query.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(
        email=user_in.email,
        role=user_in.role,
        is_active=user_in.is_active
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_in: UserUpdate, db: AsyncSession = Depends(get_db)):
    """Atualiza um usuário existente."""
    query = await db.execute(select(User).where(User.id == user_id))
    db_user = query.scalar_one_or_none()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.email is not None:
        db_user.email = user_in.email
    if user_in.role is not None:
        db_user.role = user_in.role
    if user_in.is_active is not None:
        db_user.is_active = user_in.is_active

    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Remove um usuário."""
    query = await db.execute(select(User).where(User.id == user_id))
    db_user = query.scalar_one_or_none()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(db_user)
    await db.commit()
    return {"message": "User deleted"}
