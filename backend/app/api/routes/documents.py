from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session

from app.api.schemas import DocumentResponse, DocumentListResponse, UploadResponse
from app.config import UPLOAD_DIR
from app.models import get_db, Document, Space
from app.services.document_processor import document_processor
from app.services.rag_pipeline import rag_pipeline

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    space_ids: Annotated[list[int], Form()] = [],
    db: Session = Depends(get_db),
):
    if not document_processor.is_supported(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {', '.join(document_processor.SUPPORTED_TYPES)}",
        )

    if not space_ids:
        raise HTTPException(status_code=400, detail="At least one space_id is required")

    spaces = db.query(Space).filter(Space.id.in_(space_ids)).all()
    if len(spaces) != len(space_ids):
        found_ids = {s.id for s in spaces}
        missing = [sid for sid in space_ids if sid not in found_ids]
        raise HTTPException(status_code=404, detail=f"Spaces not found: {missing}")

    content = await file.read()
    content_hash = document_processor.compute_hash(content)

    existing = db.query(Document).filter(Document.content_hash == content_hash).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Document already exists: {existing.filename}",
        )

    file_path = UPLOAD_DIR / f"{content_hash}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(content)

    document = Document(
        filename=file.filename,
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


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    space_id: int | None = Query(None),
    db: Session = Depends(get_db),
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
async def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(document)


@router.post("/{document_id}/spaces/{space_id}")
async def add_document_to_space(
    document_id: int,
    space_id: int,
    db: Session = Depends(get_db),
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

    return {"message": f"Document added to space '{space.name}'"}


@router.delete("/{document_id}/spaces/{space_id}")
async def remove_document_from_space(
    document_id: int,
    space_id: int,
    db: Session = Depends(get_db),
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

    return {"message": f"Document removed from space '{space.name}'"}


@router.post("/{document_id}/reprocess")
async def reprocess_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    rag_pipeline.delete_document_chunks(document, db)
    chunk_count = rag_pipeline.process_document(document, db)

    return {"message": f"Document reprocessed. {chunk_count} chunks created."}


@router.delete("/{document_id}")
async def delete_document(document_id: int, db: Session = Depends(get_db)):
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
