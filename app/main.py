from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload, system, chapter, users, observability, configuration
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

# app.include_router(auth.router, prefix="/api/v1", tags=["auth"]) # Auth not implemented as router yet
app.include_router(upload.router, prefix="/api/v1", tags=["upload"])
app.include_router(system.router, prefix="/api/v1", tags=["systems"])
app.include_router(chapter.router, prefix="/api/v1", tags=["chapters"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(observability.router, prefix="/api/v1/observability", tags=["observability"])
app.include_router(configuration.router, prefix="/api/v1", tags=["configuration"])

@app.get("/")
def read_root():
    return {"message": "FozDocs API is running in Docker!"}
