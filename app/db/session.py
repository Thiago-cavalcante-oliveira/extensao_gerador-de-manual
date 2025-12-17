from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

# 1. Criamos o "Motor" (Engine) Assíncrono
# echo=True faz o SQL ser logado no terminal (ótimo para debug)
engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    echo=True
)

# 2. Criamos a "Fábrica" de Sessões
# Cada requisição vai pedir uma sessão nova a esta fábrica.
# expire_on_commit=False é importante para o modo async.
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)

# 3. Dependência (Dependency Injection) para o FastAPI
# Usaremos isso nas rotas: async def minha_rota(db: AsyncSession = Depends(get_db)):
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
