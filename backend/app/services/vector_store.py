from pathlib import Path

import chromadb
from chromadb.config import Settings

from app.config import settings, BASE_DIR


class VectorStoreService:
    COLLECTION_NAME = "polidex_chunks"

    def __init__(self, persist_dir: str = settings.chroma_persist_dir):
        persist_path = Path(persist_dir)
        if not persist_path.is_absolute():
            persist_path = BASE_DIR / persist_dir

        persist_path.mkdir(parents=True, exist_ok=True)

        self._client = chromadb.PersistentClient(
            path=str(persist_path),
            settings=Settings(anonymized_telemetry=False),
        )
        self._collection = None

    @property
    def collection(self):
        if self._collection is None:
            self._collection = self._client.get_or_create_collection(
                name=self.COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    def add_chunks(
        self,
        ids: list[str],
        embeddings: list[list[float]],
        documents: list[str],
        metadatas: list[dict],
    ) -> None:
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )

    def query(
        self,
        query_embedding: list[float],
        n_results: int = 5,
        where: dict | None = None,
    ) -> dict:
        return self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

    def delete_by_document_id(self, document_id: int) -> None:
        self.collection.delete(where={"document_id": document_id})

    def get_by_document_id(self, document_id: int) -> dict:
        return self.collection.get(
            where={"document_id": document_id},
            include=["documents", "metadatas"],
        )

    def count(self) -> int:
        return self.collection.count()


vector_store = VectorStoreService()
