"""API router for chat endpoints."""

from fastapi import APIRouter

router = APIRouter(prefix="/chat", tags=["chat"])


# TODO: Add endpoints
# POST /chat - Send a message and get AI response
# GET /chat/conversations - List user's conversations
# GET /chat/conversations/{id} - Get conversation history
# DELETE /chat/conversations/{id} - Delete a conversation
