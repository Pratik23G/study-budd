# StudyBudd

A full-stack study application with AI-powered features.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | FastAPI, Pydantic, PydanticAI |
| Database | PostgreSQL 16 + pgvector |
| Package Managers | npm (frontend), UV (backend) |
| Containerization | Docker, Docker Compose |

## Project Structure

```
study-budd/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── api/                    # FastAPI backend
│       ├── app/
│       │   ├── routers/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   └── core/
│       ├── alembic/
│       ├── tests/
│       ├── pyproject.toml
│       └── Dockerfile
│
├── packages/                   # Shared code (optional)
├── docker/
│   └── postgres/
│       └── init.sql
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── Makefile
└── README.md
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.12+ and [UV](https://docs.astral.sh/uv/) (for local backend development)

### Environment Setup

Create a `.env` file in the root directory:

```bash
# Application
DEBUG=false

# Security
SECRET_KEY=your-secret-key-change-in-production

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=studybudd
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/studybudd

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# AI/LLM Configuration (for PydanticAI)
# OPENAI_API_KEY=your-openai-api-key
# ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Running with Docker

**Start all services:**

```bash
# Using the helper script
./docker-run.sh

# Or using Make
make up

# Or directly with docker compose
docker compose up
```

**Development mode (with hot reload):**

```bash
make dev
# or
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Stop all services:**

```bash
make down
# or
docker compose down
```

### Running Locally (without Docker)

**Frontend:**

```bash
cd apps/web
npm install
npm run dev
```

**Backend:**

```bash
cd apps/api
uv sync
uv run uvicorn app.main:app --reload
```

**Database:**

```bash
# Start only the database with Docker
make db-up
```

## Available Commands

Run `make help` to see all available commands:

| Command | Description |
|---------|-------------|
| `make dev` | Start all services in development mode |
| `make build` | Build all Docker images |
| `make up` | Start all services (production, detached) |
| `make down` | Stop all services |
| `make logs` | Follow logs from all services |
| `make clean` | Stop services and remove volumes |
| `make web-dev` | Run frontend locally |
| `make api-dev` | Run API locally |
| `make db-migrate` | Run database migrations |
| `make install` | Install all dependencies |

## API Documentation

Once the API is running, access the documentation at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js web application |
| API | http://localhost:8000 | FastAPI backend |
| Database | localhost:5433 | PostgreSQL with pgvector |

## License

MIT
