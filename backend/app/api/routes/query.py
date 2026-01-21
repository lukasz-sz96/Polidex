from fastapi import APIRouter

router = APIRouter()


@router.post("/query")
async def external_query():
    return {"answer": "", "sources": []}


@router.get("/health")
async def health():
    return {"status": "healthy"}
