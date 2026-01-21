import os
from pathlib import Path
from sqlalchemy.orm import Session
from app.models import Space, Document, engine
from app.services.document_processor import document_processor
from app.services.chunker import text_chunker
from app.services.embedder import embedding_service
from app.services.vector_store import vector_store

SEED_DIR = Path(__file__).parent.parent.parent / "seed_data"


def seed_database():
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        existing = db.query(Space).filter(Space.name == "Polidex Documentation").first()
        if existing:
            return

        space = Space(name="Polidex Documentation", description="Official documentation and guides for Polidex")
        db.add(space)
        db.commit()
        db.refresh(space)

        if not SEED_DIR.exists():
            return

        for filepath in SEED_DIR.glob("*.md"):
            content = filepath.read_text()
            filename = filepath.name

            doc = Document(
                filename=filename,
                file_size=len(content.encode()),
                mime_type="text/markdown",
            )
            doc.spaces.append(space)
            db.add(doc)
            db.commit()
            db.refresh(doc)

            chunks = text_chunker.chunk(content)
            embeddings = embedding_service.embed(chunks)

            vector_store.add_chunks(
                document_id=doc.id,
                chunks=chunks,
                embeddings=embeddings,
                metadata={"filename": filename, "space_id": space.id},
            )

            doc.chunk_count = len(chunks)
            db.commit()

    finally:
        db.close()
