"""
app/services/voice_service.py — Text-to-Speech (TTS) service abstraction.

Architecture:
- VoiceService: Provider-agnostic base class.
- ElevenLabsVoiceService: Official ElevenLabs SDK streaming implementation.
- Provider-agnostic design allows swapping providers (e.g. Deepgram Aura, Cartesia) without touching business logic.
"""
import logging
from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Default professional voice: Rachel (neutral, clear interviewer persona)
DEFAULT_ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"


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
    """
    ElevenLabs TTS service using official async SDK.
    Streams MP3 audio chunks directly to frontend for minimal latency.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_voice_id: Optional[str] = None,
        model_id: str = "eleven_turbo_v2_5",
    ):
        self._api_key = (api_key or settings.elevenlabs_api_key).strip()
        self._default_voice_id = (
            default_voice_id or settings.elevenlabs_voice_id or DEFAULT_ELEVENLABS_VOICE_ID
        ).strip()
        self._model_id = model_id
        self._client = None

        if self._api_key:
            try:
                from elevenlabs.client import AsyncElevenLabs
                self._client = AsyncElevenLabs(api_key=self._api_key)
                logger.info("ElevenLabsVoiceService initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize ElevenLabs client: {e}")
                self._client = None
        else:
            logger.info("ElevenLabsVoiceService initialized without API key (offline/fallback mode).")

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
        """
        Generate audio stream for question text.
        Yields chunked audio/mpeg bytes.
        """
        if not self.is_available():
            raise RuntimeError(
                "ElevenLabs API key is not configured. Set ELEVENLABS_API_KEY in backend environment."
            )

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


# Global singleton instance
voice_service: VoiceService = ElevenLabsVoiceService()
