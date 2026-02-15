"""Add processing tables for RAG (processing_documents, document_chunks)

Revision ID: 20260211_000001
Revises: 20260129_000001
Create Date: 2026-02-11

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260211_000001"
down_revision: Union[str, None] = "20260129_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create processing_documents table (idempotent - handles partial migration recovery)
    op.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS processing_documents (
            id UUID NOT NULL PRIMARY KEY,
            title VARCHAR(255) NOT NULL DEFAULT 'untitled',
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            error TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        )
    """))

    # Create document_chunks with vector. Must run in autocommit_block (CREATE EXTENSION
    # cannot run inside a transaction). Requires pgvector to be available:
    # 1. Supabase: Dashboard -> Database -> Extensions -> enable "vector"
    # 2. Use the DIRECT DB URL (port 5432), not the pooler (port 6543). See docs/rag-setup.md
    with op.get_context().autocommit_block():
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")
        # Single statement so search_path and CREATE TABLE use same session
        op.execute(sa.text("""
            SET search_path TO public, extensions;
            CREATE TABLE IF NOT EXISTS document_chunks (
                id UUID NOT NULL PRIMARY KEY,
                document_id UUID NOT NULL REFERENCES processing_documents(id) ON DELETE CASCADE,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                metadata JSONB NOT NULL DEFAULT '{}',
                embedding vector(768) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            );
        """))
        op.execute("""
            CREATE INDEX IF NOT EXISTS ix_document_chunks_document_id
            ON document_chunks (document_id)
        """)
        op.execute("""
            CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
            ON document_chunks
            USING hnsw (embedding vector_cosine_ops)
        """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_document_chunks_embedding")
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_document_id")
    op.execute("DROP TABLE IF EXISTS document_chunks")
    op.execute("DROP TABLE IF EXISTS processing_documents")
