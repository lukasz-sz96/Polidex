from app.models.database import Base, engine, SessionLocal, get_db
from app.models.document import Document, Chunk
from app.models.api_key import APIKey
from app.models.query_log import QueryLog

__all__ = [
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "Document",
    "Chunk",
    "APIKey",
    "QueryLog",
]


def init_db():
    Base.metadata.create_all(bind=engine)
