"""API router for document processing endpoints."""

from fastapi import APIRouter

router = APIRouter(prefix="/processing", tags=["processing"])


# TODO: Add endpoints
# POST /processing/{document_id} - Trigger processing for a document
# GET /processing/{document_id}/status - Get processing status
# GET /processing/{document_id}/chunks - Get document chunks
