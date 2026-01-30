"""SQLAlchemy models for the documents module."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# =============================================================================
# Base Classes and Mixins
# =============================================================================


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


class TimestampMixin:
    """Mixin for adding created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
    )


class UUIDMixin:
    """Mixin for adding UUID primary key."""

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )


# =============================================================================
# Document Entity
# =============================================================================


class Document(Base, UUIDMixin, TimestampMixin):
    """Entity for storing uploaded document metadata.

    Attributes:
        id: Unique identifier (UUID).
        user_id: ID of the user who owns the document.
        filename: Generated unique filename in storage.
        original_filename: Original filename uploaded by user.
        file_type: Type category ("pdf" or "image").
        mime_type: MIME type of the file.
        file_size: Size in bytes.
        storage_path: Path in Supabase Storage.
        created_at: Timestamp when document was created.
        updated_at: Timestamp when document was last updated.
    """

    __tablename__ = "documents"

    user_id: Mapped[UUID] = mapped_column(index=True)
    filename: Mapped[str] = mapped_column(String(255))
    original_filename: Mapped[str] = mapped_column(String(255))
    file_type: Mapped[str] = mapped_column(String(50))
    mime_type: Mapped[str] = mapped_column(String(100))
    file_size: Mapped[int]
    storage_path: Mapped[str] = mapped_column(String(500))

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Document(id={self.id}, filename={self.filename}, user_id={self.user_id})>"
