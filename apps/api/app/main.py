"""Main FastAPI application entry point."""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

from app.documents.router import router as documents_router

# --- 1. Configuration & Setup ---

# Load environment variables from the .env file
load_dotenv()

# Retrieve Supabase credentials (use service key for server-side operations)
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_KEY") or 
    os.environ.get("SUPABASE_KEY") or 
    os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

# Initialize Supabase Client
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase client initialized successfully.")
    except Exception as e:
        print(f"Error initializing Supabase: {e}")
else:
    print(f"WARNING: Supabase credentials not found. URL={bool(SUPABASE_URL)}, KEY={bool(SUPABASE_KEY)}")

# Initialize FastAPI App (Keeping your original metadata)
app = FastAPI(
    title="StudyBudd API",
    description="Backend API for StudyBudd application",
    version="0.1.0",
)

# --- 2. Middleware (CORS) ---

# CORS middleware
# Note: allowing ["*"] is better for local dev to avoid issues with localhost vs 127.0.0.1
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents_router, prefix="/api")

# --- 3. Data Models ---

class UserCredentials(BaseModel):
    """Schema for user login and registration."""
    email: str
    password: str

# --- 4. API Endpoints ---

@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Welcome to StudyBudd API"}

@app.get("/health")
async def health_check():
    """Health check endpoint with DB status."""
    return {
        "status": "healthy", 
        "database_connected": supabase is not None
    }

@app.post("/api/auth/signup")
async def sign_up(credentials: UserCredentials):
    """Registers a new user using Supabase Auth."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database configuration missing.")

    try:
        response = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password
        })
        return {"message": "User registered successfully", "user": response.user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
async def login(credentials: UserCredentials):
    """Logs in an existing user and returns an access token."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database configuration missing.")

    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        return {
            "access_token": response.session.access_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

# --- 5. Local Execution ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)