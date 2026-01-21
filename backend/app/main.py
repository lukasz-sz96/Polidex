from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import documents, chat, query, api_keys

app = FastAPI(
    title="Polidex RAG API",
    description="RAG Admin System for managing knowledge base documents",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(query.router, prefix="/api/v1", tags=["external"])
app.include_router(api_keys.router, prefix="/api/api-keys", tags=["api-keys"])


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
