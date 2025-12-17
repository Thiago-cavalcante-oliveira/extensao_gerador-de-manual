from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, system
from app.db.init_db import init_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Cria tabelas e popula dados iniciais
    await init_tables()
    yield
    # Shutdown

app = FastAPI(title="FozDocs API", version="1.0.0", lifespan=lifespan)

# Configuração CORS (Permitir que a extensão fale com o backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, especifique a ID da extensão: "chrome-extension://..."
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
app.include_router(system.router, prefix="/api/v1", tags=["System"])

@app.get("/")
def read_root():
    return {"message": "FozDocs API is running in Docker!"}
