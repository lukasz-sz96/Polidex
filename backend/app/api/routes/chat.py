from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.schemas import ChatRequest, ChatResponse
from app.models import get_db, Space
from app.services.rag_pipeline import rag_pipeline
from app.services.query_logger import query_logger

router = APIRouter()


@router.post("/query", response_model=ChatResponse)
async def query_chat(request: ChatRequest, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == request.space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    with query_logger.timer() as get_latency:
        result = await rag_pipeline.query(
            query_text=request.query,
            space_id=request.space_id,
            top_k=request.top_k,
        )
        latency_ms = get_latency()

    query_logger.log(
        db=db,
        query_text=request.query,
        response_text=result.answer,
        chunks_retrieved=result.chunks_retrieved,
        latency_ms=latency_ms,
        model_used=result.model,
        source="admin_chat",
    )

    sources = [
        {
            "document_id": s.document_id,
            "filename": s.filename,
            "chunk_index": s.chunk_index,
            "content": s.content[:500] + "..." if len(s.content) > 500 else s.content,
            "score": round(s.score, 4),
        }
        for s in result.sources
    ]

    return ChatResponse(answer=result.answer, sources=sources)
