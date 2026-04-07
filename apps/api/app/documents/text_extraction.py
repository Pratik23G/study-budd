"""Extract text from uploaded documents for RAG processing."""

import csv
import io
from typing import TYPE_CHECKING
import pdfplumber

from app.core.supabase import download_file
from app.documents.models import Document

if TYPE_CHECKING:
    pass


def extract_text_from_document(document: Document) -> str:
    """Extract text from a document (text, CSV, or PDF file).

    Args:
        document: Document entity with storage_path, file_type, mime_type.

    Returns:
        Extracted text as a string.

    Raises:
        ValueError: If file_type is not supported for text extraction.
    """
    if document.file_type not in ("text", "csv", "pdf"):
        raise ValueError(
            f"Only text and CSV documents can be processed for RAG; got file_type={document.file_type!r}"
        )

    if document.file_type == "pdf":
        content = download_file(document.storage_path)
        with pdfplumber.open(io.BytesIO(content)) as pdf:


            pages: list[str] = []
            for page in pdf.pages:
                tables = page.extract_tables()

                if tables:
                    for table in tables:
                        headers = table[0]
                        for i, row in enumerate(table[1:], start = 1):
                            pairs = [f"{h} = {v}" for h, v in zip(headers, row) if v and v.strip()]
                            pages.append(f"Row {i}: {','.join(pairs)}")
                else:
                    text = page.extract_text()
                    if text:
                        pages.append(text.strip())

            return "\n\n".join(pages).strip()

    content = download_file(document.storage_path)
    raw = content.decode("utf-8-sig")

    if document.file_type == "text":
        return raw.strip()

    if document.file_type == "csv":
        reader = csv.reader(io.StringIO(raw))
        firstHeader = next(reader)
        parts: list[str] = []

        if not firstHeader:
            return ""

        for (row_number, row) in enumerate(reader, start = 1):
            result = []
            newReadList = zip(firstHeader, row)

            for header, value in newReadList:
                newEntry = header + "=" + value
                if value.strip():
                    result.append(newEntry)
            
            joined_string = ", ".join(result)
            parts.append(f"Row {row_number}: {joined_string}")
            
        return "\n".join(parts)

    return ""
