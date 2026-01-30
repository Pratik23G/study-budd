"""SQLAlchemy models for chat and conversations."""

# TODO: Add models:
#
# class Conversation:
#     id: UUID
#     user_id: UUID
#     title: str
#     created_at: datetime
#     updated_at: datetime
#
# class Message:
#     id: UUID
#     conversation_id: UUID (FK)
#     role: str ("user" | "assistant")
#     content: str
#     sources: JSON (list of chunk references)
#     created_at: datetime
