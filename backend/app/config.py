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

    # LLM Configuration
    llm_api_key: str = ""
    llm_model: str = ""
    llm_base_url: str = ""

    # Legacy / Provider-specific LLM keys
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    openai_api_key: str = ""

    @property
    def effective_llm_api_key(self) -> str:
        return self.llm_api_key or self.groq_api_key or self.openai_api_key

    @property
    def effective_llm_base_url(self) -> str:
        if self.llm_base_url:
            return self.llm_base_url
        if self.groq_api_key or (self.llm_api_key and self.llm_api_key.startswith("gsk_")):
            return "https://api.groq.com/openai/v1"
        return "https://api.openai.com/v1"

    @property
    def effective_llm_model(self) -> str:
        if self.llm_model:
            return self.llm_model
        if "groq" in self.effective_llm_base_url:
            return self.groq_model or "llama-3.3-70b-versatile"
        return "gpt-4o-mini"

    # STT / TTS
    deepgram_api_key: str = ""
    tts_api_key: str = ""
    tts_model: str = ""
    tts_voice: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    @property
    def effective_tts_api_key(self) -> str:
        return self.tts_api_key or self.elevenlabs_api_key or self.openai_api_key

    @property
    def effective_tts_voice(self) -> str:
        return self.tts_voice or self.elevenlabs_voice_id or "21m00Tcm4TlvDq8ikWAM"


    # App
    secret_key: str = "changeme"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    debug: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
