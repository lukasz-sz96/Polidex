from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from app.models import get_db, APIKey
from app.services.api_key_service import api_key_service

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_api_key(
    api_key: str = Security(api_key_header),
    db: Session = Depends(get_db),
) -> APIKey:
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Include X-API-Key header.",
        )

    verified_key = api_key_service.verify(db, api_key)
    if not verified_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key.",
        )

    return verified_key
