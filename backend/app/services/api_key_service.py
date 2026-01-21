import secrets
from datetime import datetime

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from sqlalchemy.orm import Session

from app.models import APIKey, Space

ph = PasswordHasher()


class APIKeyService:
    PREFIX = "pdx_"
    KEY_LENGTH = 32

    def generate_key(self) -> str:
        return self.PREFIX + secrets.token_hex(self.KEY_LENGTH)

    def hash_key(self, key: str) -> str:
        return ph.hash(key)

    def verify_hash(self, key_hash: str, raw_key: str) -> bool:
        try:
            ph.verify(key_hash, raw_key)
            return True
        except VerifyMismatchError:
            return False

    def get_prefix(self, key: str) -> str:
        return key[:12]

    def create(
        self,
        db: Session,
        name: str,
        space_id: int,
    ) -> tuple[APIKey, str]:
        space = db.query(Space).filter(Space.id == space_id).first()
        if not space:
            raise ValueError("Space not found")

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
        key_prefix = self.get_prefix(raw_key)
        candidates = db.query(APIKey).filter(
            APIKey.key_prefix == key_prefix,
            APIKey.is_active == True,
        ).all()

        for api_key in candidates:
            if self.verify_hash(api_key.key_hash, raw_key):
                if ph.check_needs_rehash(api_key.key_hash):
                    api_key.key_hash = self.hash_key(raw_key)
                    db.commit()
                return api_key

        return None

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
