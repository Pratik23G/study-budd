"""Shared fixtures for StudyBudd API tests."""
import pytest
from unittest.mock import AsyncMock
from uuid import UUID

from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.dependencies import get_current_user, get_db, AuthenticatedUser

TEST_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


@pytest.fixture
def mock_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=TEST_USER_ID, email="test@test.com")


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
async def client(mock_user: AuthenticatedUser, mock_db: AsyncMock) -> AsyncClient:
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
