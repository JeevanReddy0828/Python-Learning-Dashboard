from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://adhd:adhd_secret@localhost:5432/adhd_dashboard"
    secret_key: str = "dev_secret_key_change_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    # OpenAI (default)
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # NVIDIA NIM — set these to use NVIDIA instead of OpenAI
    # Get a free key at https://build.nvidia.com/
    nvidia_api_key: str = ""
    nvidia_model: str = "meta/llama-3.1-8b-instruct"
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"

    @property
    def ai_api_key(self) -> str:
        return self.nvidia_api_key if self.nvidia_api_key else self.openai_api_key

    @property
    def ai_model(self) -> str:
        return self.nvidia_model if self.nvidia_api_key else self.openai_model

    @property
    def ai_base_url(self) -> str | None:
        return self.nvidia_base_url if self.nvidia_api_key else None

    @property
    def ai_provider(self) -> str:
        return "nvidia" if self.nvidia_api_key else "openai"
    code_execution_timeout: int = 10
    max_hint_level: int = 3
    cors_origins: List[str] = ["http://localhost:5173"]

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Supabase (optional — realtime presence + storage)
    supabase_url: str = ""
    supabase_anon_key: str = ""

    # Notion (optional — progress export)
    notion_token: str = ""
    notion_database_id: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
