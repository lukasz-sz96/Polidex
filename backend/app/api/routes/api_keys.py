from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.schemas import APIKeyCreate, APIKeyResponse, APIKeyCreateResponse, APIKeyListResponse
from app.models import get_db, Space
from app.services.api_key_service import api_key_service
from app.core.auth import require_admin

router = APIRouter()


@router.post("", response_model=APIKeyCreateResponse)
async def create_api_key(
    request: APIKeyCreate,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    space = db.query(Space).filter(Space.id == request.space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    try:
        api_key, raw_key = api_key_service.create(
            db=db,
            name=request.name,
            space_id=request.space_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return APIKeyCreateResponse(
        id=api_key.id,
        name=api_key.name,
        space_id=api_key.space_id,
        key=raw_key,
        message="API key created. Store this key securely - it won't be shown again.",
    )


@router.get("", response_model=APIKeyListResponse)
async def list_api_keys(
    space_id: int | None = Query(None, gt=0),
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    if space_id:
        keys = api_key_service.list_by_space(db, space_id)
    else:
        keys = api_key_service.list_all(db)

    api_keys = []
    for key in keys:
        api_keys.append(APIKeyResponse(
            id=key.id,
            name=key.name,
            space_id=key.space_id,
            space_name=key.space.name,
            key_prefix=key.key_prefix,
            is_active=key.is_active,
            request_count=key.request_count,
            last_used_at=key.last_used_at,
            created_at=key.created_at,
        ))

    return APIKeyListResponse(api_keys=api_keys)


@router.post("/{key_id}/revoke")
async def revoke_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    success = api_key_service.revoke(db, key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key revoked"}


@router.delete("/{key_id}")
async def delete_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(require_admin),
):
    success = api_key_service.delete(db, key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key deleted"}
