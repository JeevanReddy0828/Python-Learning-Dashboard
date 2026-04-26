from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://adhd:adhd_secret@localhost:5432/adhd_dashboard"
    secret_key: str = "dev_secret_key_change_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    code_execution_timeout: int = 10
    max_hint_level: int = 3
    cors_origins: List[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"


settings = Settings()
