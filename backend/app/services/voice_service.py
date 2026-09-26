"""
app/services/voice_service.py — Text-to-Speech (TTS) service abstraction.

Architecture:
- VoiceService: Provider-agnostic base class.
- ElevenLabsVoiceService: Official ElevenLabs SDK streaming implementation.
- OpenAIVoiceService: OpenAI TTS streaming implementation (model: tts-1 / tts-1-hd).
- UnifiedVoiceService: Dispatches to available provider (ElevenLabs or OpenAI).
"""
import logging
from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

DEFAULT_ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
DEFAULT_OPENAI_VOICE = "alloy"


class VoiceService(ABC):
    """Abstract interface for text-to-speech services."""

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the voice provider is configured with credentials."""
        pass

    @abstractmethod
    async def generate_speech_stream(
        self,
        text: str,
        voice_id: Optional[str] = None,
    ) -> AsyncIterator[bytes]:
        """Streams audio bytes for the given text."""
        pass


class ElevenLabsVoiceService(VoiceService):
    """ElevenLabs TTS service using official async SDK."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_voice_id: Optional[str] = None,
        model_id: str = "eleven_turbo_v2_5",
    ):
        self._api_key = (api_key or settings.elevenlabs_api_key or settings.effective_tts_api_key).strip()
        self._default_voice_id = (
            default_voice_id or settings.elevenlabs_voice_id or settings.effective_tts_voice or DEFAULT_ELEVENLABS_VOICE_ID
        ).strip()
        self._model_id = model_id
        self._client = None

        if self._api_key and not self._api_key.startswith("sk-proj-"):
            try:
                from elevenlabs.client import AsyncElevenLabs
                self._client = AsyncElevenLabs(api_key=self._api_key)
                logger.info("ElevenLabsVoiceService initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize ElevenLabs client: {e}")
                self._client = None

    def is_available(self) -> bool:
        return bool(self._api_key and self._client)

    @property
    def default_voice_id(self) -> str:
        return self._default_voice_id

    async def generate_speech_stream(
        self,
        text: str,
        voice_id: Optional[str] = None,
    ) -> AsyncIterator[bytes]:
        if not self.is_available():
            raise RuntimeError("ElevenLabs API key is not configured.")

        active_voice = voice_id or self._default_voice_id
        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValueError("Cannot synthesize audio for empty text.")

        try:
            audio_stream = await self._client.text_to_speech.convert(
                voice_id=active_voice,
                text=cleaned_text,
                model_id=self._model_id,
                output_format="mp3_44100_128",
            )
            async for chunk in audio_stream:
                if chunk:
                    yield chunk
        except Exception as e:
            logger.error(f"ElevenLabs TTS streaming error: {e}")
            raise


class OpenAIVoiceService(VoiceService):
    """OpenAI TTS service generating streaming MP3 chunks."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        voice: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self._api_key = (api_key or settings.effective_tts_api_key or settings.openai_api_key).strip()
        self._voice = (voice or settings.tts_voice or DEFAULT_OPENAI_VOICE).strip()
        self._model = (model or settings.tts_model or "tts-1").strip()

    def is_available(self) -> bool:
        return bool(self._api_key and (self._api_key.startswith("sk-") or "openai" in settings.effective_llm_base_url))

    async def generate_speech_stream(
        self,
        text: str,
        voice_id: Optional[str] = None,
    ) -> AsyncIterator[bytes]:
        if not self.is_available():
            raise RuntimeError("OpenAI TTS API key is not configured.")

        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValueError("Cannot synthesize audio for empty text.")

        url = "https://api.openai.com/v1/audio/speech"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._model,
            "input": cleaned_text,
            "voice": voice_id or self._voice,
            "response_format": "mp3",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                if resp.status_code != 200:
                    err_bytes = await resp.aread()
                    raise RuntimeError(f"OpenAI TTS error ({resp.status_code}): {err_bytes.decode('utf-8', errors='ignore')}")
                async for chunk in resp.aiter_bytes(chunk_size=4096):
                    if chunk:
                        yield chunk


class UnifiedVoiceService(VoiceService):
    """Dispatches to ElevenLabs or OpenAI TTS depending on available credentials."""

    def __init__(self):
        self.eleven = ElevenLabsVoiceService()
        self.openai = OpenAIVoiceService()

    def is_available(self) -> bool:
        return self.eleven.is_available() or self.openai.is_available()

    @property
    def default_voice_id(self) -> str:
        if self.eleven.is_available():
            return self.eleven.default_voice_id
        return DEFAULT_OPENAI_VOICE

    async def generate_speech_stream(
        self,
        text: str,
        voice_id: Optional[str] = None,
    ) -> AsyncIterator[bytes]:
        if self.eleven.is_available():
            async for chunk in self.eleven.generate_speech_stream(text, voice_id):
                yield chunk
        elif self.openai.is_available():
            async for chunk in self.openai.generate_speech_stream(text, voice_id):
                yield chunk
        else:
            raise RuntimeError("No TTS provider is configured.")


# Global singleton instance
voice_service: VoiceService = UnifiedVoiceService()
