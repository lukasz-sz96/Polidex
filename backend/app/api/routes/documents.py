import re
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api.schemas import DocumentResponse, DocumentListResponse, UploadResponse
from app.config import UPLOAD_DIR, settings
from app.models import get_db, Document, Space
from app.services.document_processor import document_processor
from app.services.rag_pipeline import rag_pipeline
from app.core.auth import require_admin

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def sanitize_filename(filename: str) -> str:
    name = Path(filename).name
    name = re.sub(r'[^\w\s\-.]', '', name)
    name = re.sub(r'\s+', '_', name)
    if len(name) > 200:
        ext = Path(name).suffix
        name = name[:200 - len(ext)] + ext
    return name or "document"


@router.post("/upload", response_model=UploadResponse)
@limiter.limit("10/minute")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    space_ids: Annotated[list[int], Form()] = [],
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    if not document_processor.is_supported(file.filename):
        raise HTTPException(status_code=400, detail="Unsupported file type")

    if not space_ids:
        raise HTTPException(status_code=400, detail="At least one space_id is required")

    spaces = db.query(Space).filter(Space.id.in_(space_ids)).all()
    if len(spaces) != len(space_ids):
        raise HTTPException(status_code=404, detail="One or more spaces not found")

    content = await file.read()

    if len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_file_size // (1024 * 1024)}MB",
        )

    content_hash = document_processor.compute_hash(content)

    existing = db.query(Document).filter(Document.content_hash == content_hash).first()
    if existing:
        raise HTTPException(status_code=409, detail="A document with this content already exists")

    safe_filename = sanitize_filename(file.filename)
    file_path = UPLOAD_DIR / f"{content_hash}_{safe_filename}"

    try:
        with open(file_path, "wb") as f:
            f.write(content)

        document = Document(
            filename=safe_filename,
            file_type=document_processor.get_file_type(file.filename),
            file_size=len(content),
            file_path=str(file_path),
            content_hash=content_hash,
            chunk_count=0,
        )
        document.spaces = spaces
        db.add(document)
        db.commit()
        db.refresh(document)

        chunk_count = rag_pipeline.process_document(document, db)

        return UploadResponse(
            id=document.id,
            filename=document.filename,
            file_type=document.file_type,
            file_size=document.file_size,
            space_ids=[s.id for s in document.spaces],
            message=f"Document uploaded and processed. {chunk_count} chunks created.",
        )
    except Exception:
        if file_path.exists():
            file_path.unlink()
        raise


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    space_id: int | None = Query(None, gt=0),
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    query = db.query(Document)
    if space_id:
        query = query.join(Document.spaces).filter(Space.id == space_id)
    documents = query.order_by(Document.created_at.desc()).all()
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(doc) for doc in documents],
        total=len(documents),
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(document)


@router.post("/{document_id}/spaces/{space_id}")
async def add_document_to_space(
    document_id: int,
    space_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    if space not in document.spaces:
        document.spaces.append(space)
        db.commit()

    return {"message": "Document added to space"}


@router.delete("/{document_id}/spaces/{space_id}")
async def remove_document_from_space(
    document_id: int,
    space_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    if space in document.spaces:
        document.spaces.remove(space)
        db.commit()

    return {"message": "Document removed from space"}


@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    rag_pipeline.delete_document_chunks(document, db)
    chunk_count = rag_pipeline.process_document(document, db)

    return {"message": f"Document reprocessed. {chunk_count} chunks created."}


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    rag_pipeline.delete_document_chunks(document, db)

    file_path = Path(document.file_path)
    if file_path.exists():
        file_path.unlink()

    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}
