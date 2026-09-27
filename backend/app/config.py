"""Application configuration loaded from environment / .env file."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object. Values come from environment variables or .env."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # LLM provider
    llm_mode: str = "mock"  # "mock" | "api"
    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4o-mini"
    llm_timeout: float = 60.0
    llm_max_input_chars: int = 24000

    # PubMed
    pubmed_email: str = ""
    pubmed_api_key: str = ""

    # CORS
    frontend_origin: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]

    @property
    def effective_mode(self) -> str:
        """The mode we can actually serve: fall back to mock if api is misconfigured."""
        if self.llm_mode.lower() == "api" and self.llm_api_key:
            return "api"
        return "mock"


@lru_cache
def get_settings() -> Settings:
    return Settings()
