"""FastAPI dependencies for authentication and database access."""

from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import async_session_maker

settings = get_settings()
security = HTTPBearer()


# =============================================================================
# Authentication
# =============================================================================


class AuthenticatedUser:
    """Authenticated user extracted from Supabase JWT."""

    def __init__(self, user_id: UUID, email: str | None = None) -> None:
        """Initialize authenticated user.

        Args:
            user_id: The user's unique identifier.
            email: The user's email address (optional).
        """
        self.user_id = user_id
        self.email = email


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> AuthenticatedUser:
    """Verify Supabase JWT token and extract user information.

    Args:
        credentials: HTTP Bearer token from Authorization header.

    Returns:
        AuthenticatedUser with user_id and email.

    Raises:
        HTTPException: If token is invalid or expired.
    """
    token = credentials.credentials

    # Dev mode bypass: if debug=True and dev_user_id is set, skip JWT validation
    if settings.debug and settings.dev_user_id:
        return AuthenticatedUser(
            user_id=UUID(settings.dev_user_id),
            email="dev@localhost",
        )

    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase JWT secret not configured",
        )

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )

        user_id = UUID(user_id_str)
        email = payload.get("email")

        return AuthenticatedUser(user_id=user_id, email=email)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e!s}",
        )


# =============================================================================
# Database
# =============================================================================


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database sessions.

    Yields:
        AsyncSession: SQLAlchemy async session.
    """
    async with async_session_maker() as session:
        yield session


# =============================================================================
# Type Aliases for Dependency Injection
# =============================================================================

CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
