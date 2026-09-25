"""
app/config.py — Application configuration loaded from environment variables.
All secrets live here. Frontend never sees these values.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/aiinterviewer"

    # Neo4j / Graphiti
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""
    # Backward compatibility aliases
    neo4j_url: str = ""
    neo4j_username: str = ""

    @property
    def effective_neo4j_uri(self) -> str:
        return self.neo4j_uri or self.neo4j_url or "bolt://localhost:7687"

    @property
    def effective_neo4j_user(self) -> str:
        return self.neo4j_user or self.neo4j_username or "neo4j"

    # LLM
    openai_api_key: str = ""
    llm_model: str = "gpt-4o-mini"

    # STT / TTS (future)
    deepgram_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    # App
    secret_key: str = "changeme"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    debug: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
