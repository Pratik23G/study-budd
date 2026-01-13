# StudyBudd API

FastAPI backend for the StudyBudd application.

## Tech Stack

- **Python 3.12**
- **FastAPI** - Web framework
- **Pydantic / PydanticAI** - Data validation and AI agents
- **SQLAlchemy** - ORM
- **PostgreSQL + pgvector** - Database with vector embeddings
- **UV** - Package manager
- **Alembic** - Database migrations

## Development Setup

### Prerequisites

- Python 3.12+
- [UV](https://docs.astral.sh/uv/) package manager
- PostgreSQL with pgvector extension

### Installation

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload
```

### Database Migrations

```bash
# Create a new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head
```

## API Documentation

Once running, access the API docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
