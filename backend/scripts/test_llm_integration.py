"""
backend/scripts/test_llm_integration.py — Tests dynamic LLM question generation,
answer evaluation, TTS streaming, and final report generation.
"""
import asyncio
import os
import sys
from unittest.mock import AsyncMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.llm_service import (
    LLMQuestionOutput,
    LLMEvaluationOutput,
    LLMEvidenceItem,
    LLMReportOutput,
    llm_service,
)
from app.services.voice_service import voice_service


async def test_llm_flow():
    print("\n=== TESTING LLM & TTS INTEGRATION ===")
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test TTS endpoint without key -> should return 503 so frontend uses speech synthesis fallback
        print("\n--- Testing TTS status and endpoint ---")
        status_res = await client.get("/api/voice/status")
        assert status_res.status_code == 200
        print(f"TTS Status: {status_res.json()}")

        # When no key is set:
        tts_res = await client.post("/api/voice/tts", json={"text": "Hello, how does a hash map work?"})
        assert tts_res.status_code in (200, 503)
        print(f"TTS offline response: {tts_res.status_code} (Graceful fallback to browser speech)")

        # When TTS generates stream:
        async def mock_audio_chunks(text, voice_id=None):
            yield b"\xff\xfb\x90\x44"  # MP3 frame header simulation
            yield b"\x00" * 64

        with patch.object(voice_service, "is_available", return_value=True), \
             patch.object(voice_service, "generate_speech_stream", side_effect=mock_audio_chunks):
            tts_active = await client.post("/api/voice/tts", json={"text": "Test question stream"})
            assert tts_active.status_code == 200
            assert tts_active.headers["content-type"] == "audio/mpeg"
            audio_bytes = tts_active.content
            assert len(audio_bytes) > 0
            print(f"TTS streaming active: 200 OK, {len(audio_bytes)} bytes audio/mpeg streamed")

        # 2. Test Dynamic LLM Question Generation
        print("\n--- Testing Dynamic LLM Question Generation ---")
        mock_question = LLMQuestionOutput(
            question="Can you explain how database indexes work under the hood and what trade-offs they introduce for write operations?",
            question_type="analytical",
            expected_concepts=["B-Tree structure", "pointer lookups", "write amplification", "disk I/O optimization"],
            follow_up_prompts=["How would a composite index affect query performance if column order changes?"],
        )

        # Create session
        res_session = await client.post(
            "/api/sessions",
            json={
                "user_id": "user-001",
                "target_role_id": "role-001",
                "duration": "quick",
                "focus_competencies": ["comp-sql", "comp-python"],
            },
        )
        assert res_session.status_code == 201
        sess_id = res_session.json()["id"]

        with patch.object(llm_service, "is_available", return_value=True), \
             patch.object(llm_service, "generate_question", new_callable=AsyncMock, return_value=mock_question):
            
            # Start session -> should invoke LLM to generate first question
            res_start = await client.post(f"/api/sessions/{sess_id}/start")
            assert res_start.status_code == 200
            start_data = res_start.json()
            q1 = start_data["first_question"]
            print(f"Dynamic Question Generated: '{q1['question']}'")
            print(f"Question ID: {q1['question_id']}, Type: {q1['question_type']}")
            print(f"Expected Concepts: {q1['expected_concepts']}")
            assert q1["question"] == mock_question.question

        # 3. Test LLM Answer Evaluation
        print("\n--- Testing LLM Answer Evaluation ---")
        mock_eval = LLMEvaluationOutput(
            correctness=0.88,
            assessment="demonstrated",
            confidence=0.92,
            concepts_demonstrated=["B-Tree structure", "write amplification", "disk I/O optimization"],
            concepts_missing=["pointer lookups"],
            evidence=[
                LLMEvidenceItem(concept="B-Tree structure", status="demonstrated", explanation="Candidate correctly explained B-Tree node branching.", confidence=0.94),
                LLMEvidenceItem(concept="write amplification", status="demonstrated", explanation="Explicitly noted index rebuild overhead on INSERT/UPDATE.", confidence=0.90),
                LLMEvidenceItem(concept="disk I/O optimization", status="demonstrated", explanation="Discussed sequential vs random I/O benefits.", confidence=0.88),
                LLMEvidenceItem(concept="pointer lookups", status="missing", explanation="Did not mention row pointer or clustered key lookups.", confidence=0.85),
            ],
        )

        with patch.object(llm_service, "is_available", return_value=True), \
             patch.object(llm_service, "evaluate_answer", new_callable=AsyncMock, return_value=mock_eval):
            
            ans_res = await client.post(
                f"/api/sessions/{sess_id}/answers",
                json={
                    "question_id": q1["question_id"],
                    "transcript": "Database indexes usually use B-Trees to avoid full table scans by organizing keys in balanced trees. However, every INSERT requires updating the index which causes write amplification and disk I/O.",
                    "duration_ms": 18500,
                },
            )
            assert ans_res.status_code == 200
            eval_data = ans_res.json()
            print(f"Evaluation Correctness: {eval_data['correctness'] * 100:.1f}%")
            print(f"Assessment: {eval_data['assessment']}")
            print(f"Demonstrated: {eval_data['concepts_demonstrated']}")
            print(f"Missing: {eval_data['concepts_missing']}")
            print(f"Adaptive Action: {eval_data['adaptive_state']['last_action']}")
            assert eval_data["correctness"] == 0.88
            assert eval_data["adaptive_state"]["last_action"] == "increase"

        # 4. Test Final Report Generation with LLM
        print("\n--- Testing LLM Final Report Generation ---")
        # Advance session to complete
        mock_report = LLMReportOutput(
            summary=(
                "The candidate displayed strong architectural comprehension of relational storage engines and indexing mechanics. "
                "They articulated clear trade-offs between read and write operations with solid technical accuracy. "
                "Minor development opportunities remain around low-level pointer management and memory caching."
            ),
            recommendations=[
                "Deep dive into clustered vs non-clustered index storage representations.",
                "Practice tuning execution plans using EXPLAIN ANALYZE on high-throughput workloads.",
                "Explore write-optimized storage structures like Log-Structured Merge (LSM) trees.",
            ],
        )

        # Force session complete for report test
        from app.database import AsyncSessionLocal
        from app.models.session import AssessmentSession
        async with AsyncSessionLocal() as s:
            db_sess = await s.get(AssessmentSession, sess_id)
            db_sess.status = "completed"
            await s.commit()

        with patch.object(llm_service, "is_available", return_value=True), \
             patch.object(llm_service, "generate_report", new_callable=AsyncMock, return_value=mock_report):
            
            rep_res = await client.get(f"/api/sessions/{sess_id}/report")
            assert rep_res.status_code == 200
            rep_data = rep_res.json()
            print(f"Report Summary: {rep_data['summary'][:120]}...")
            print("Recommendations:")
            for r in rep_data["recommendations"]:
                print(f"  • {r}")
            assert rep_data["summary"] == mock_report.summary
            assert len(rep_data["recommendations"]) == 3

    print("\n>>> ALL LLM & TTS INTEGRATION TESTS PASSED! <<<")


if __name__ == "__main__":
    asyncio.run(test_llm_flow())
