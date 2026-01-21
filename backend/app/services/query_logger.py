import time
from contextlib import contextmanager

from sqlalchemy.orm import Session

from app.models import QueryLog


class QueryLogger:
    @contextmanager
    def timer(self):
        start = time.perf_counter()
        yield lambda: (time.perf_counter() - start) * 1000

    def log(
        self,
        db: Session,
        query_text: str,
        response_text: str,
        chunks_retrieved: int,
        latency_ms: float,
        model_used: str,
        source: str,
        api_key_id: int | None = None,
    ) -> QueryLog:
        log_entry = QueryLog(
            api_key_id=api_key_id,
            query_text=query_text,
            response_text=response_text,
            chunks_retrieved=chunks_retrieved,
            latency_ms=latency_ms,
            model_used=model_used,
            source=source,
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    def get_recent(self, db: Session, limit: int = 100) -> list[QueryLog]:
        return (
            db.query(QueryLog)
            .order_by(QueryLog.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_stats(self, db: Session) -> dict:
        from sqlalchemy import func

        total = db.query(func.count(QueryLog.id)).scalar() or 0
        avg_latency = db.query(func.avg(QueryLog.latency_ms)).scalar() or 0
        avg_chunks = db.query(func.avg(QueryLog.chunks_retrieved)).scalar() or 0

        return {
            "total_queries": total,
            "avg_latency_ms": round(avg_latency, 2),
            "avg_chunks_retrieved": round(avg_chunks, 2),
        }


query_logger = QueryLogger()
