import secrets
import hashlib
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import APIKey, Space


class APIKeyService:
    PREFIX = "pdx_"
    KEY_LENGTH = 32

    def generate_key(self) -> str:
        return self.PREFIX + secrets.token_urlsafe(self.KEY_LENGTH)

    def hash_key(self, key: str) -> str:
        return hashlib.sha256(key.encode()).hexdigest()

    def get_prefix(self, key: str) -> str:
        return key[:8]

    def create(
        self,
        db: Session,
        name: str,
        space_id: int,
    ) -> tuple[APIKey, str]:
        space = db.query(Space).filter(Space.id == space_id).first()
        if not space:
            raise ValueError(f"Space with id {space_id} not found")

        raw_key = self.generate_key()
        key_hash = self.hash_key(raw_key)
        key_prefix = self.get_prefix(raw_key)

        api_key = APIKey(
            name=name,
            space_id=space_id,
            key_hash=key_hash,
            key_prefix=key_prefix,
        )
        db.add(api_key)
        db.commit()
        db.refresh(api_key)

        return api_key, raw_key

    def verify(self, db: Session, raw_key: str) -> APIKey | None:
        key_hash = self.hash_key(raw_key)
        api_key = db.query(APIKey).filter(
            APIKey.key_hash == key_hash,
            APIKey.is_active == True,
        ).first()
        return api_key

    def update_usage(self, db: Session, api_key: APIKey) -> None:
        api_key.request_count += 1
        api_key.last_used_at = datetime.utcnow()
        db.commit()

    def revoke(self, db: Session, api_key_id: int) -> bool:
        api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
        if not api_key:
            return False
        api_key.is_active = False
        db.commit()
        return True

    def delete(self, db: Session, api_key_id: int) -> bool:
        api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
        if not api_key:
            return False
        db.delete(api_key)
        db.commit()
        return True

    def list_all(self, db: Session) -> list[APIKey]:
        return db.query(APIKey).order_by(APIKey.created_at.desc()).all()

    def list_by_space(self, db: Session, space_id: int) -> list[APIKey]:
        return db.query(APIKey).filter(APIKey.space_id == space_id).order_by(APIKey.created_at.desc()).all()


api_key_service = APIKeyService()
