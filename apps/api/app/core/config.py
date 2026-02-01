"""Application configuration using Pydantic settings."""

from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "StudyBudd API"
    debug: bool = False
    
    # Development - set DEV_USER_ID to bypass auth in debug mode
    dev_user_id: str | None = None

    # Database - prefer DATABASE_URL if set, otherwise build from components
    database_url_raw: str | None = Field(default=None, validation_alias="DATABASE_URL")
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "postgres"
    db_password: str = "postgres"
    db_name: str = "postgres"

    @computed_field
    @property
    def database_url(self) -> str:
        """Get database URL - prefer DATABASE_URL env var, else build from components."""
        if self.database_url_raw:
            url = self.database_url_raw
            # Convert postgresql:// to postgresql+asyncpg:// for async support
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            return url
        # Fall back to building from components
        encoded_password = quote_plus(self.db_password)
        return f"postgresql+asyncpg://{self.db_user}:{encoded_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    # Security
    secret_key: str = "change-me-in-production"

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_storage_bucket: str = "documents"

    # Upload limits
    max_upload_size_mb: int = 10


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
