# Centralizamos as importações aqui para facilitar
# Assim podemos fazer: from app.models import Collection, Chapter
from .collection import Collection
from .chapter import Chapter
from .system import System
from .module import Module
from .observability import ProcessingJob, AuditLog, Feedback
from .user import User, UserRole
