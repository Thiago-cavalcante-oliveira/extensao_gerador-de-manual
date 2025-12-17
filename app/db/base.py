from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """
    Classe base para todos os modelos SQLAlchemy.
    Todas as tabelas herdarão desta classe.
    """
    pass
