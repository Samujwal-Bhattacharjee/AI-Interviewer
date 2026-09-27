"""
backend/scripts/test_live_credentials.py — Verify live LLM and ElevenLabs connections.
Does NOT print any secrets or sensitive keys.
"""
import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.services.llm_service import LLMService
from app.services.voice_service import ElevenLabsVoiceService


async def test_llm():
    print("--- 1. Testing LLM Connection ---")
    llm = LLMService()
    if not llm.is_available():
        print("[FAIL] LLM service reports not available. Check credentials.")
        return False
    print(f"Base URL: {llm._base_url}")
    print(f"Model: {llm._model}")
    print(f"API key configured: Yes (length {len(llm._api_key)})")

    # Test basic evaluation
    try:
        result = await llm.evaluate_answer(
            question="What is the difference between a process and a thread?",
            expected_concepts=["separate memory space", "shared memory", "context switching overhead", "concurrency"],
            competency_name="System Architecture",
            competency_id="sys-arch",
            transcript="A process has its own separate memory address space and resources, while threads run inside the same process and share memory. Context switching between processes is generally more expensive than threads.",
            role_title="Software Engineer",
            role_level="mid",
            difficulty="medium",
        )
        print(f"[PASS] LLM Evaluation successful!")
        print(f"  Assessment: {result.assessment}")
        print(f"  Correctness: {result.correctness}")
        print(f"  Demonstrated: {result.concepts_demonstrated}")
        print(f"  Missing: {result.concepts_missing}")
        print(f"  Evidence items: {len(result.evidence)}")
        return True
    except Exception as e:
        print(f"[FAIL] LLM call failed: {e}")
        return False


async def test_elevenlabs():
    print("\n--- 2. Testing ElevenLabs Connection ---")
    voice = ElevenLabsVoiceService()
    if not voice.is_available():
        print("[FAIL] ElevenLabs service reports not available. Check credentials.")
        return False
    print(f"Voice ID: {voice.default_voice_id}")
    print(f"Model ID: {voice._model_id}")
    print(f"API key configured: Yes (length {len(voice._api_key)})")

    try:
        chunks = []
        total_bytes = 0
        async for chunk in voice.generate_speech_stream(
            text="Hello. This is a live voice synthesis test for your adaptive interview.",
            voice_id=voice.default_voice_id,
        ):
            chunks.append(chunk)
            total_bytes += len(chunk)

        print(f"[PASS] ElevenLabs TTS streaming successful!")
        print(f"  Received chunks: {len(chunks)}")
        print(f"  Total audio bytes: {total_bytes}")
        return True
    except Exception as e:
        print(f"[FAIL] ElevenLabs TTS failed: {e}")
        return False


async def main():
    llm_ok = await test_llm()
    tts_ok = await test_elevenlabs()
    print("\n===============================")
    print(f"LLM Status:        {'READY' if llm_ok else 'FAILED'}")
    print(f"ElevenLabs Status: {'READY' if tts_ok else 'FAILED'}")
    print("===============================")
    if not (llm_ok and tts_ok):
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
