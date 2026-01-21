from datetime import datetime
from sqlalchemy import String, DateTime, Table, Column, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.database import Base

document_spaces = Table(
    "document_spaces",
    Base.metadata,
    Column("document_id", Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
    Column("space_id", Integer, ForeignKey("spaces.id", ondelete="CASCADE"), primary_key=True),
)


class Space(Base):
    __tablename__ = "spaces"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents: Mapped[list["Document"]] = relationship(
        "Document",
        secondary=document_spaces,
        back_populates="spaces",
    )
    api_keys: Mapped[list["APIKey"]] = relationship("APIKey", back_populates="space")
