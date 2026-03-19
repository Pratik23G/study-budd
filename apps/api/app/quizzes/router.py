"""API router for quiz endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.core.dependencies import CurrentUser, DbSession
from app.core.rate_limiter import rate_limiter
from app.core.token_budget import token_budget
from app.quizzes.schemas import (
    QuizGenerateRequest,
    QuizSetResponse,
    QuizSetSummary,
)
from app.quizzes.service import QuizService

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.post("/generate", response_model=QuizSetResponse)
async def generate_quiz(
    req: QuizGenerateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> QuizSetResponse:
    """Generate a new quiz set from user documents."""
    user_id = str(current_user.user_id)
    settings = get_settings()
    if not rate_limiter.is_allowed(
        user_id, "generate", settings.rate_limit_generate_max, settings.rate_limit_generate_window
    ):
        raise HTTPException(
            status_code=429,
            detail="Generation rate limit exceeded. Please wait before generating more quizzes.",
        )
    if not token_budget.check():
        raise HTTPException(
            status_code=503,
            detail="Daily AI usage limit reached. Please try again tomorrow.",
        )
    return await QuizService.generate(
        db=db,
        user_id=current_user.user_id,
        title=req.title,
        folder_id=req.folder_id,
        document_ids=req.document_ids,
        topic=req.topic,
        num_questions=req.num_questions,
    )


@router.get("/sets", response_model=list[QuizSetSummary])
async def list_quiz_sets(
    current_user: CurrentUser,
    db: DbSession,
) -> list[QuizSetSummary]:
    """List all quiz sets for the current user."""
    return await QuizService.list_sets(db, current_user.user_id)


@router.get("/sets/{set_id}", response_model=QuizSetResponse)
async def get_quiz_set(
    set_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> QuizSetResponse:
    """Get a quiz set with all its questions."""
    return await QuizService.get_set(db, current_user.user_id, set_id)


@router.delete("/sets/{set_id}", status_code=204)
async def delete_quiz_set(
    set_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """Delete a quiz set."""
    await QuizService.delete_set(db, current_user.user_id, set_id)
