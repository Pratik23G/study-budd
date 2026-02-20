"""Tests for document upload and management endpoints."""
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException, UploadFile
from httpx import AsyncClient

from app.documents.service import DocumentService

TEST_DOC_ID = UUID("00000000-0000-0000-0000-000000000002")
TEST_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


def make_mock_document(file_type: str = "pdf", mime_type: str = "application/pdf") -> MagicMock:
    """Create a mock Document with all fields required by DocumentResponse."""
    doc = MagicMock()
    doc.id = TEST_DOC_ID
    doc.user_id = TEST_USER_ID
    doc.filename = "abc123.pdf"
    doc.original_filename = "test.pdf"
    doc.file_type = file_type
    doc.mime_type = mime_type
    doc.file_size = 1024
    doc.storage_path = f"user/{TEST_USER_ID}/abc123.pdf"
    doc.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    doc.updated_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    return doc


# =============================================================================
# Unit Tests: DocumentService.validate_file_type
# =============================================================================


def test_validate_file_type_valid_pdf():
    """Valid PDF MIME type returns 'pdf' category."""
    file = MagicMock(spec=UploadFile)
    file.content_type = "application/pdf"
    assert DocumentService.validate_file_type(file) == "pdf"


def test_validate_file_type_valid_csv():
    """Valid CSV MIME type returns 'csv' category."""
    file = MagicMock(spec=UploadFile)
    file.content_type = "text/csv"
    assert DocumentService.validate_file_type(file) == "csv"


def test_validate_file_type_valid_image():
    """Valid PNG MIME type returns 'image' category."""
    file = MagicMock(spec=UploadFile)
    file.content_type = "image/png"
    assert DocumentService.validate_file_type(file) == "image"


def test_validate_file_type_invalid_raises_400():
    """Unsupported MIME type raises HTTPException with status 400."""
    file = MagicMock(spec=UploadFile)
    file.content_type = "application/zip"
    with pytest.raises(HTTPException) as exc_info:
        DocumentService.validate_file_type(file)
    assert exc_info.value.status_code == 400


def test_validate_file_type_no_content_type_raises_400():
    """Missing content type raises HTTPException with status 400."""
    file = MagicMock(spec=UploadFile)
    file.content_type = None
    with pytest.raises(HTTPException) as exc_info:
        DocumentService.validate_file_type(file)
    assert exc_info.value.status_code == 400


# =============================================================================
# Router Integration Tests
# =============================================================================


async def test_upload_pdf_returns_unsupported_processing(client: AsyncClient):
    """Uploading a PDF returns processing_status='unsupported'."""
    mock_doc = make_mock_document(file_type="pdf")
    with patch(
        "app.documents.router.DocumentService.upload",
        new=AsyncMock(return_value=mock_doc),
    ):
        response = await client.post(
            "/api/documents/upload",
            files={"file": ("test.pdf", b"%PDF-1.4 fake", "application/pdf")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["processing_status"] == "unsupported"
    assert data["message"] == "Document uploaded successfully"


async def test_upload_text_file_triggers_rag(client: AsyncClient):
    """Uploading a text file triggers RAG processing and returns result."""
    mock_doc = make_mock_document(file_type="text", mime_type="text/plain")

    mock_result = MagicMock()
    mock_result.status = "ready"
    mock_result.chunks_count = 3
    mock_result.error = None

    with (
        patch(
            "app.documents.router.DocumentService.upload",
            new=AsyncMock(return_value=mock_doc),
        ),
        patch(
            "app.documents.router.ProcessingService.process_document",
            new=AsyncMock(return_value=mock_result),
        ),
        patch(
            "app.documents.router.extract_text_from_document",
            return_value="sample text",
        ),
    ):
        response = await client.post(
            "/api/documents/upload",
            files={"file": ("test.txt", b"sample text content", "text/plain")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["processing_status"] == "ready"
    assert data["chunks_count"] == 3


async def test_upload_invalid_mime_type_returns_400(client: AsyncClient):
    """Uploading a ZIP file returns 400 Bad Request."""
    response = await client.post(
        "/api/documents/upload",
        files={"file": ("test.zip", b"PK fake zip", "application/zip")},
    )
    assert response.status_code == 400


async def test_list_documents_returns_empty(client: AsyncClient):
    """GET /api/documents returns empty list when user has no documents."""
    with patch(
        "app.documents.router.DocumentService.list_by_user",
        new=AsyncMock(return_value=[]),
    ):
        response = await client.get("/api/documents")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["documents"] == []


async def test_get_document_not_found_returns_404(client: AsyncClient):
    """GET /api/documents/{id} returns 404 when document is not found."""
    some_id = uuid4()
    with patch(
        "app.documents.router.DocumentService.get_by_id",
        new=AsyncMock(return_value=None),
    ):
        response = await client.get(f"/api/documents/{some_id}")

    assert response.status_code == 404
