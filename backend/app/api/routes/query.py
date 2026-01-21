from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.schemas import ExternalQueryRequest, ExternalQueryResponse
from app.api.auth import get_api_key
from app.models import get_db, APIKey
from app.services.rag_pipeline import rag_pipeline
from app.services.api_key_service import api_key_service
from app.services.query_logger import query_logger

router = APIRouter()


@router.post("/query", response_model=ExternalQueryResponse)
async def external_query(
    request: ExternalQueryRequest,
    api_key: APIKey = Depends(get_api_key),
    db: Session = Depends(get_db),
):
    with query_logger.timer() as get_latency:
        result = await rag_pipeline.query(
            query_text=request.query,
            space_id=api_key.space_id,
            top_k=request.top_k,
            system_prompt=request.system_prompt,
        )
        latency_ms = get_latency()

    api_key_service.update_usage(db, api_key)

    query_logger.log(
        db=db,
        query_text=request.query,
        response_text=result.answer,
        chunks_retrieved=result.chunks_retrieved,
        latency_ms=latency_ms,
        model_used=result.model,
        source="external_api",
        api_key_id=api_key.id,
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

    return ExternalQueryResponse(answer=result.answer, sources=sources)


@router.get("/health")
async def health():
    return {"status": "healthy"}
