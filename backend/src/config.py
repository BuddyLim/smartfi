from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    AWS_KEY: str = ""
    AWS_SECRET_KEY: str = ""
    USE_GEMINI: bool = False
    USE_BEDROCK: bool = False
    PREFILL_TABLES: bool = True
    PYTHONPATH: str = ""
    GCP_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env")


@lru_cache
def get_settings():
    return Settings()
