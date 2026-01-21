from datetime import datetime
from pydantic import BaseModel


class SpaceCreate(BaseModel):
    name: str
    description: str | None = None


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
    query: str
    space_id: int
    top_k: int = 5


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]


class ExternalQueryRequest(BaseModel):
    query: str
    top_k: int = 5


class ExternalQueryResponse(BaseModel):
    answer: str
    sources: list[dict]


class APIKeyCreate(BaseModel):
    name: str
    space_id: int


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
