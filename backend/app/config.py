import warnings
from pydantic_settings import BaseSettings
from typing import List

_INSECURE_SECRET = "dev_secret_key_change_in_production"


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://adhd:adhd_secret@localhost:5432/adhd_dashboard"
    secret_key: str = _INSECURE_SECRET
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    code_execution_timeout: int = 10
    max_hint_level: int = 3
    cors_origins: List[str] = ["http://localhost:5173"]

    # ── AI providers ──────────────────────────────────────────────────────────
    # Priority: Z.ai > NVIDIA > OpenAI (first key that is set wins)

    # Option A — OpenAI  (https://platform.openai.com)
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Option B — NVIDIA NIM  (https://build.nvidia.com)
    nvidia_api_key: str = ""
    nvidia_model: str = "meta/llama-3.1-8b-instruct"
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"

    # Option C — Z.ai / ZhipuAI GLM  (https://open.bigmodel.cn)
    zai_api_key: str = ""
    zai_model: str = "glm-5.1"
    zai_base_url: str = "https://open.bigmodel.cn/api/paas/v4/"

    # ── Computed properties — everything else reads these ─────────────────────

    @property
    def ai_provider(self) -> str:
        if self.zai_api_key:
            return "zai"
        if self.nvidia_api_key:
            return "nvidia"
        return "openai"

    @property
    def ai_api_key(self) -> str:
        if self.zai_api_key:
            return self.zai_api_key
        if self.nvidia_api_key:
            return self.nvidia_api_key
        return self.openai_api_key

    @property
    def ai_model(self) -> str:
        if self.zai_api_key:
            return self.zai_model
        if self.nvidia_api_key:
            return self.nvidia_model
        return self.openai_model

    @property
    def ai_base_url(self) -> str | None:
        if self.zai_api_key:
            return self.zai_base_url
        if self.nvidia_api_key:
            return self.nvidia_base_url
        return None  # OpenAI default

    @property
    def ai_supports_json_mode(self) -> bool:
        """Only OpenAI reliably supports response_format=json_object."""
        return self.ai_provider == "openai"

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379"

    # ── Supabase (optional — realtime presence) ───────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""

    # ── Notion (optional — progress export) ──────────────────────────────────
    notion_token: str = ""
    notion_database_id: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

if settings.secret_key == _INSECURE_SECRET:
    warnings.warn(
        "SECRET_KEY is set to the insecure default. Set a strong SECRET_KEY in .env before deploying.",
        stacklevel=1,
    )
