from datetime import datetime
from pydantic import BaseModel, Field


class SpaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=500)


class SpaceResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class SpaceDetailResponse(BaseModel):
    id: int
    name: str
    description: str | None
    document_count: int
    api_key_count: int
    created_at: datetime
    updated_at: datetime


class SpaceListResponse(BaseModel):
    spaces: list[SpaceResponse]
    total: int


class SpaceBrief(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    spaces: list[SpaceBrief]
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


class UploadResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    space_ids: list[int]
    message: str


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=10000)
    space_id: int = Field(..., gt=0)
    top_k: int = Field(default=5, ge=1, le=50)


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]


class ExternalQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=10000)
    top_k: int = Field(default=5, ge=1, le=50)
    system_prompt: str | None = Field(None, max_length=2000)


class ExternalQueryResponse(BaseModel):
    answer: str
    sources: list[dict]


class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    space_id: int = Field(..., gt=0)


class APIKeyResponse(BaseModel):
    id: int
    name: str
    space_id: int
    space_name: str
    key_prefix: str
    is_active: bool
    request_count: int
    last_used_at: datetime | None
    created_at: datetime


class APIKeyCreateResponse(BaseModel):
    id: int
    name: str
    space_id: int
    key: str
    message: str


class APIKeyListResponse(BaseModel):
    api_keys: list[APIKeyResponse]


class QueryLogResponse(BaseModel):
    id: int
    query_text: str
    response_text: str
    chunks_retrieved: int
    latency_ms: float
    model_used: str
    source: str
    prompt_tokens: int
    completion_tokens: int
    cost: float
    created_at: datetime

    class Config:
        from_attributes = True


class QueryLogListResponse(BaseModel):
    logs: list[QueryLogResponse]
    total: int


class StatsResponse(BaseModel):
    total_queries: int
    avg_latency_ms: float
    avg_chunks_retrieved: float
    total_documents: int
    total_chunks: int
    total_spaces: int


class UsageLogResponse(BaseModel):
    id: int
    query_text: str
    response_text: str
    model_used: str
    prompt_tokens: int
    completion_tokens: int
    cost: float
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


class UsageResponse(BaseModel):
    total_cost: float
    total_prompt_tokens: int
    total_completion_tokens: int
    total_requests: int
    logs: list[UsageLogResponse]
