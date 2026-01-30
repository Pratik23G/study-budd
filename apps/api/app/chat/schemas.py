"""Pydantic schemas for chat operations."""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Request schema for sending a chat message."""

    # TODO: Define fields
    # - message: str
    # - conversation_id: UUID | None
    # - document_ids: list[UUID] | None (for context)
    pass


class ChatResponse(BaseModel):
    """Response schema for chat message."""

    # TODO: Define fields
    # - message: str
    # - sources: list[SourceReference]
    # - conversation_id: UUID
    pass


class MessageResponse(BaseModel):
    """Response schema for a single message."""

    # TODO: Define fields
    pass


class ConversationResponse(BaseModel):
    """Response schema for a conversation."""

    # TODO: Define fields
    pass
