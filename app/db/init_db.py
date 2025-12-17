import asyncio
from app.db.session import engine
from app.db.base import Base
from app.models import *  # Importa todos os models para que o Base os conheça

async def init_tables():
    """
    Cria as tabelas no banco de dados.
    Em produção, usaríamos Alembic (Migrações), mas para este MVP
    usaremos create_all para simplificar o aprendizado.
    """
    async with engine.begin() as conn:
        print("Criando tabelas no banco de dados...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tabelas criadas com sucesso!")

    # Seed Data (Dados Iniciais)
    from sqlalchemy import select
    from app.models import System, Module
    from app.db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        print("Verificando dados iniciais...")
        result = await db.execute(select(System).limit(1))
        system = result.scalars().first()
        
        if not system:
            print("Populando banco com Sistemas de Exemplo...")
            
            # Sistema Saúde
            saude = System(name="Saúde (Prontuário)", context_prompt="Sistema de gestão hospitalar. Telas com fundo branco e azul. Termos comuns: Paciente, Triagem, CID.")
            db.add(saude)
            await db.flush() # Para pegar o ID
            
            # Módulos Saúde
            db.add(Module(system_id=saude.id, name="Triagem", context_prompt="Módulo de classificação de risco. Cores: Vermelho, Amarelo, Verde."))
            db.add(Module(system_id=saude.id, name="Recepção", context_prompt="Cadastro de pacientes e agendamento."))

            # Sistema Tributário
            tributario = System(name="Tributário (ISS)", context_prompt="Sistema fiscal. Telas com muitos grids e números. Termos: Alíquota, DAM, Contribuinte.")
            db.add(tributario)
            await db.flush()
            
            db.add(Module(system_id=tributario.id, name="Nota Fiscal", context_prompt="Emissão de notas."))
            
            await db.commit()
            print("Sistemas/Módulos seedados!")
        
        # Seed Users
        from app.models.user import User, UserRole
        result_users = await db.execute(select(User).limit(1))
        if not result_users.scalars().first():
            print("Populando Users de Teste...")
            users = [
                User(email="admin@fozdocs.local", role=UserRole.ADMIN),
                User(email="produtor@fozdocs.local", role=UserRole.PRODUCER),
                User(email="leitor@fozdocs.local", role=UserRole.READER),
            ]
            db.add_all(users)
            await db.commit()
            print("Users criados: admin@, produtor@, leitor@")
        else:
            print("Users já existem.")


if __name__ == "__main__":
    asyncio.run(init_tables())
