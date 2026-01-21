import uuid
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Document, Chunk
from app.services.document_processor import document_processor
from app.services.chunker import text_chunker
from app.services.embedder import embedding_service
from app.services.vector_store import vector_store
from app.core.openrouter import openrouter_client


@dataclass
class Source:
    document_id: int
    filename: str
    chunk_index: int
    content: str
    score: float


@dataclass
class RAGResponse:
    answer: str
    sources: list[Source]
    model: str
    chunks_retrieved: int


class RAGPipeline:
    def process_document(self, document: Document, db: Session) -> int:
        file_path = Path(document.file_path)
        text = document_processor.extract_text(file_path)
        chunks = text_chunker.chunk(text)

        if not chunks:
            return 0

        chunk_contents = [c.content for c in chunks]
        embeddings = embedding_service.embed_batch(chunk_contents)

        space_ids = ",".join(str(s.id) for s in document.spaces)

        chroma_ids = []
        chroma_metadatas = []
        db_chunks = []

        for chunk, embedding in zip(chunks, embeddings):
            chroma_id = f"doc-{document.id}-chunk-{chunk.index}-{uuid.uuid4().hex[:8]}"
            chroma_ids.append(chroma_id)

            chroma_metadatas.append({
                "document_id": document.id,
                "filename": document.filename,
                "chunk_index": chunk.index,
                "space_ids": space_ids,
            })

            db_chunk = Chunk(
                document_id=document.id,
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
        document.chunk_count = len(chunks)
        db.commit()

        return len(chunks)

    def delete_document_chunks(self, document: Document, db: Session) -> None:
        vector_store.delete_by_document_id(document.id)
        db.query(Chunk).filter(Chunk.document_id == document.id).delete()
        document.chunk_count = 0
        db.commit()

    async def query(
        self,
        query_text: str,
        space_id: int,
        top_k: int = 5,
        model: str | None = None,
    ) -> RAGResponse:
        query_embedding = embedding_service.embed(query_text)

        results = vector_store.query(
            query_embedding=query_embedding,
            n_results=top_k,
            where={"space_ids": {"$contains": str(space_id)}},
        )

        sources = []
        context_chunks = []

        if results["documents"] and results["documents"][0]:
            documents = results["documents"][0]
            metadatas = results["metadatas"][0]
            distances = results["distances"][0]

            for doc, meta, dist in zip(documents, metadatas, distances):
                score = 1 - dist
                sources.append(Source(
                    document_id=meta["document_id"],
                    filename=meta["filename"],
                    chunk_index=meta["chunk_index"],
                    content=doc,
                    score=score,
                ))
                context_chunks.append(doc)

        if not context_chunks:
            return RAGResponse(
                answer="I couldn't find any relevant information in the knowledge base to answer your question.",
                sources=[],
                model=model or openrouter_client.default_model,
                chunks_retrieved=0,
            )

        response = await openrouter_client.generate_rag_response(
            query=query_text,
            context_chunks=context_chunks,
            model=model,
        )

        return RAGResponse(
            answer=response.content,
            sources=sources,
            model=response.model,
            chunks_retrieved=len(sources),
        )


rag_pipeline = RAGPipeline()
