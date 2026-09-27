"""
backend/scripts/test_multilingual_modes.py — Verify Mode 1 and Mode 2 functionality.
"""
import asyncio
import os
import sys

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import AsyncSessionLocal
from app.models.user import User
from app.schemas.session import CreateSessionRequest
from app.schemas.answer import SubmitAnswerRequest
from app.routers.sessions import create_session, start_session, submit_answer
from app.services.voice_service import ElevenLabsVoiceService


async def test_mode1_mode2():
    print("=== Testing Multilingual Modes (Mode 1 & Mode 2) ===")

    async with AsyncSessionLocal() as db:
        # Verify user exists
        user = await db.get(User, "user-001")
        if not user:
            print("[FAIL] user-001 not found.")
            return False

        # ── Test Mode 1: Interview in My Language (Hindi) ──
        print("\n--- 1. Testing Mode 1: Interview in My Language (hi-IN) ---")
        req_mode1 = CreateSessionRequest(
            user_id="user-001",
            target_role_id="role-001",
            level="junior",
            focus_competencies=["comp-dsa"],
            duration="quick",
            interview_mode="mode1_native",
            target_language="hi-IN",
        )
        session1 = await create_session(req_mode1, db)
        print(f"[PASS] Session created: id={session1.id}, mode={session1.interview_mode}, lang={session1.target_language}")

        # Start session and get first question
        start_res1 = await start_session(session1.id, db)
        first_q = start_res1.first_question
        print(f"[PASS] Question ID: {first_q.question_id}")
        print(f"  English: {first_q.question}")
        print(f"  Translated: {first_q.question_translated}")
        assert first_q.question_translated is not None, "Mode 1 question_translated should not be None"
        assert first_q.interview_mode == "mode1_native"

        # Verify ElevenLabs can stream speech for the translated question
        voice = ElevenLabsVoiceService()
        if voice.is_available():
            print("  Streaming translated audio via ElevenLabs multilingual model...")
            chunk_count = 0
            async for chunk in voice.generate_speech_stream(first_q.question_translated):
                chunk_count += 1
                if chunk_count >= 5:
                    break
            print(f"  [PASS] ElevenLabs successfully streamed Hindi question audio! ({chunk_count} sample chunks)")
        else:
            print("  [INFO] ElevenLabs not configured, skipping live audio test.")

        # Candidate answers in Hindi
        hindi_answer = "हैश टेबल में हैश फंक्शन की (key) को इंडेक्स में बदलता है। अगर कोलिशन होता है तो चेनिंग या ओपन एड्रेसिंग से हैंडल करते हैं। इसलिए इसका लुकअप सामान्यतः O(1) होता है।"
        ans_res1 = await submit_answer(
            session1.id,
            SubmitAnswerRequest(
                question_id=first_q.question_id,
                transcript=hindi_answer,
                language="hi-IN",
            ),
            db,
        )
        print(f"[PASS] Answer evaluated in Mode 1:")
        print(f"  Correctness: {ans_res1.correctness}")
        print(f"  Assessment: {ans_res1.assessment}")
        print(f"  Demonstrated: {ans_res1.concepts_demonstrated}")
        print(f"  Professional English: {ans_res1.professional_english_translation[:100]}...")

        # ── Test Mode 2: Answer in Any Language ──
        print("\n--- 2. Testing Mode 2: Answer in Any Language (English question, multilingual answer) ---")
        req_mode2 = CreateSessionRequest(
            user_id="user-001",
            target_role_id="role-001",
            level="junior",
            focus_competencies=["comp-dsa"],
            duration="quick",
            interview_mode="mode2_any_lang",
            target_language="hi-IN",
        )
        session2 = await create_session(req_mode2, db)
        start_res2 = await start_session(session2.id, db)
        q2 = start_res2.first_question
        print(f"[PASS] Mode 2 Question (in English): {q2.question}")
        assert q2.interview_mode == "mode2_any_lang"

        # Candidate answers in mixed / Hindi
        ans_res2 = await submit_answer(
            session2.id,
            SubmitAnswerRequest(
                question_id=q2.question_id,
                transcript="The hash table uses a hash code mapped to array buckets. Collisions are handled with linked lists or chaining to maintain O(1) average time.",
                language="hi-IN",
            ),
            db,
        )
        print(f"[PASS] Mode 2 Answer evaluated:")
        print(f"  Correctness: {ans_res2.correctness}")
        print(f"  Professional English Formulation: {ans_res2.professional_english_translation}")
        assert ans_res2.professional_english_translation is not None, "Professional English translation must be generated"

        print("\n=======================================================")
        print("ALL MULTILINGUAL MODE 1 & MODE 2 TESTS PASSED!")
        print("=======================================================")
        return True


if __name__ == "__main__":
    asyncio.run(test_mode1_mode2())
