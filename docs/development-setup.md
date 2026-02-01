# Development Setup

This guide explains how to set up your local development environment for StudyBudd.

## Prerequisites

- Node.js 18+
- Python 3.12+
- PostgreSQL (or Docker)
- A Supabase project (for authentication and storage)

## Environment Variables

Create a `.env` file in the **project root** (`/study-budd/.env`). This file is shared by both the frontend and backend.

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=studybudd

# Development Mode (enables auth bypass)
DEBUG=true
DEV_USER_ID=00000000-0000-0000-0000-000000000001
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Project Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY`
5. Go to **Project Settings** → **API** → **JWT Settings**
   - Copy **JWT Secret** → `SUPABASE_JWT_SECRET`

## Frontend Setup

The frontend is a Next.js application located in `apps/web/`.

```bash
cd apps/web

# Install dependencies
npm install

# Copy env file (Next.js reads from apps/web/.env or project root .env)
# Option 1: Symlink to root .env
ln -s ../../.env .env

# Option 2: Copy the root .env
cp ../../.env .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Important: Environment File Location

Next.js only reads `.env` files from its own directory (`apps/web/`). You have two options:

1. **Symlink** (recommended): `ln -s ../../.env apps/web/.env`
2. **Copy**: Manually copy the root `.env` to `apps/web/.env`

## Backend Setup

The backend is a FastAPI application located in `apps/api/`.

```bash
cd apps/api

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
API documentation is at `http://localhost:8000/docs`.

## Database Setup

### Option 1: Docker (Recommended)

```bash
# From project root
docker-compose up -d postgres
```

### Option 2: Local PostgreSQL

1. Install PostgreSQL
2. Create a database named `studybudd`
3. Update the `DB_*` variables in your `.env` file

## Running Both Services

From the project root, you can run both services in separate terminals:

**Terminal 1 - Backend:**
```bash
cd apps/api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

## Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL" Error

This means the frontend can't find the environment variables. Make sure:
1. You have a `.env` file in `apps/web/` (symlink or copy from root)
2. The variables are prefixed with `NEXT_PUBLIC_` for client-side access
3. Restart the Next.js dev server after changing env vars

### 401 Unauthorized on API Requests

In development mode, make sure:
1. `DEBUG=true` is set in your `.env`
2. `DEV_USER_ID` is set to a valid UUID
3. Restart the backend after changing env vars

See [Authentication](./authentication.md) for more details on dev mode bypass.
