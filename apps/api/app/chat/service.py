"""Business logic for chat and RAG retrieval."""


class ChatService:
    """Service for handling chat conversations with RAG."""

    # TODO: Implement methods:
    # - retrieve_context(query, document_ids) - Vector search for relevant chunks
    # - build_prompt(query, context) - Construct LLM prompt
    # - generate_response(conversation_id, message) - Full RAG pipeline
    # - create_conversation(user_id) - Start new conversation
    # - get_conversation_history(conversation_id) - Get messages
    pass


class RetrieverService:
    """Service for vector similarity search."""

    # TODO: Implement methods:
    # - search(query_embedding, document_ids, top_k) - Find similar chunks
    # - rerank(query, chunks) - Optional reranking
    pass
