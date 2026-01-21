from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings

security = HTTPBearer(auto_error=False)


async def require_admin(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> bool:
    if not settings.admin_token:
        return True

    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    if credentials.credentials != settings.admin_token:
        raise HTTPException(status_code=403, detail="Invalid credentials")

    return True
