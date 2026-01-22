import hashlib
import shutil
import uuid
from pathlib import Path

from app.models import Space, Document, Chunk, engine
from app.config import UPLOAD_DIR
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
            content_bytes = content.encode()
            content_hash = hashlib.sha256(content_bytes).hexdigest()

            dest_path = UPLOAD_DIR / f"{content_hash}_{filename}"
            shutil.copy(filepath, dest_path)

            doc = Document(
                filename=filename,
                file_type="md",
                file_size=len(content_bytes),
                file_path=str(dest_path),
                content_hash=content_hash,
            )
            doc.spaces.append(space)
            db.add(doc)
            db.commit()
            db.refresh(doc)

            chunks = text_chunker.chunk(content)
            if not chunks:
                continue

            chunk_contents = [c.content for c in chunks]
            embeddings = embedding_service.embed_batch(chunk_contents)

            space_ids = str(space.id)
            chroma_ids = []
            chroma_metadatas = []
            db_chunks = []

            for chunk, embedding in zip(chunks, embeddings):
                chroma_id = f"doc-{doc.id}-chunk-{chunk.index}-{uuid.uuid4().hex[:8]}"
                chroma_ids.append(chroma_id)

                chroma_metadatas.append({
                    "document_id": doc.id,
                    "filename": doc.filename,
                    "chunk_index": chunk.index,
                    "space_ids": space_ids,
                })

                db_chunk = Chunk(
                    document_id=doc.id,
                    chunk_index=chunk.index,
                    content=chunk.content,
                    start_char=chunk.start_char,
                    end_char=chunk.end_char,
                    chroma_id=chroma_id,
                )
                db_chunks.append(db_chunk)

            vector_store.add_chunks(
                ids=chroma_ids,
                embeddings=embeddings,
                documents=chunk_contents,
                metadatas=chroma_metadatas,
            )

            db.add_all(db_chunks)
            doc.chunk_count = len(chunks)
            db.commit()

    finally:
        db.close()
