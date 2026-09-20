from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Multi-Tenant B2B SaaS Platform (Python)"
    jwt_secret: str = "codemuscle-local-python-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60

    model_config = SettingsConfigDict(env_prefix="CODEMUSCLE_", env_file=".env")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
