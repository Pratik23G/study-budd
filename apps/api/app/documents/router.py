"""API router for document endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.dependencies import CurrentUser, DbSession
from app.documents.schemas import (
    DocumentListResponse,
    DocumentResponse,
    DocumentUploadResponse,
)
from app.documents.service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: Annotated[UploadFile, File(description="Document file (PDF, PNG, or JPEG)")],
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentUploadResponse:
    """Upload a document.

    Uploads the file to Supabase Storage and stores metadata in the database.

    - **Supported file types**: PDF, PNG, JPEG
    - **Maximum file size**: 10MB (configurable)
    """
    document = await DocumentService.upload(
        db=db,
        file=file,
        user_id=current_user.user_id,
    )

    return DocumentUploadResponse(
        message="Document uploaded successfully",
        document=DocumentResponse.model_validate(document),
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentListResponse:
    """List all documents for the authenticated user.

    Returns documents ordered by creation date (newest first).
    """
    documents = await DocumentService.list_by_user(db, current_user.user_id)

    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(doc) for doc in documents],
        total=len(documents),
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    """Get a specific document by ID.

    Only returns documents owned by the authenticated user.
    """
    document = await DocumentService.get_by_id(db, document_id, current_user.user_id)

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """Delete a document.

    Removes the file from Supabase Storage and deletes the metadata.
    Only the owner can delete their documents.
    """
    document = await DocumentService.get_by_id(db, document_id, current_user.user_id)

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    await DocumentService.delete(db, document)
