from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.schemas import QueryLogResponse, QueryLogListResponse, StatsResponse
from app.models import get_db, QueryLog, Document, Chunk, Space
from app.services.query_logger import query_logger
from app.core.auth import require_admin

router = APIRouter()


@router.get("/logs", response_model=QueryLogListResponse)
async def get_query_logs(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    logs = query_logger.get_recent(db, limit=limit)
    return QueryLogListResponse(
        logs=[QueryLogResponse.model_validate(log) for log in logs],
        total=len(logs),
    )


@router.get("/overview", response_model=StatsResponse)
async def get_stats(
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    query_stats = query_logger.get_stats(db)

    total_documents = db.query(func.count(Document.id)).scalar() or 0
    total_chunks = db.query(func.count(Chunk.id)).scalar() or 0
    total_spaces = db.query(func.count(Space.id)).scalar() or 0

    return StatsResponse(
        total_queries=query_stats["total_queries"],
        avg_latency_ms=query_stats["avg_latency_ms"],
        avg_chunks_retrieved=query_stats["avg_chunks_retrieved"],
        total_documents=total_documents,
        total_chunks=total_chunks,
        total_spaces=total_spaces,
    )
