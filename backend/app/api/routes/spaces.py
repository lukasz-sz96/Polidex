from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.schemas import SpaceCreate, SpaceResponse, SpaceListResponse, SpaceDetailResponse
from app.models import get_db, Space
from app.core.auth import require_admin

router = APIRouter()


@router.post("", response_model=SpaceResponse)
async def create_space(
    space: SpaceCreate,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    existing = db.query(Space).filter(Space.name == space.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Space with this name already exists")

    db_space = Space(name=space.name, description=space.description)
    db.add(db_space)
    db.commit()
    db.refresh(db_space)

    return SpaceResponse.model_validate(db_space)


@router.get("", response_model=SpaceListResponse)
async def list_spaces(
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    spaces = db.query(Space).order_by(Space.created_at.desc()).all()
    return SpaceListResponse(
        spaces=[SpaceResponse.model_validate(s) for s in spaces],
        total=len(spaces),
    )


@router.get("/{space_id}", response_model=SpaceDetailResponse)
async def get_space(
    space_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return SpaceDetailResponse(
        id=space.id,
        name=space.name,
        description=space.description,
        document_count=len(space.documents),
        api_key_count=len(space.api_keys),
        created_at=space.created_at,
        updated_at=space.updated_at,
    )


@router.delete("/{space_id}")
async def delete_space(
    space_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    db.delete(space)
    db.commit()

    return {"message": "Space deleted successfully"}
