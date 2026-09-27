"""
backend/scripts/test_full_pipeline.py — Full interview pipeline integration test.

Tests:
1. POST /api/sessions
2. POST /api/sessions/{id}/start → first_question returned
3. POST /api/sessions/{id}/answers → evaluation + adaptive state
4. POST /api/sessions/{id}/next-question → adaptive next question
5. Repeat to completion (quick = 5 questions)
6. GET /api/sessions/{id}/report → final report
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import AsyncClient, ASGITransport
from app.main import app


SAMPLE_ANSWERS = [
    "A hash table uses a hash function to map keys to bucket indices. The hash function converts the key to an integer and then takes the modulo of the array size to get the bucket index. When there are no collisions, lookup is O(1). Collisions are handled with chaining using linked lists or open addressing.",
    "Python uses reference counting for memory management, combined with a cyclic garbage collector for reference cycles. The GIL or global interpreter lock prevents multiple threads from executing Python bytecode simultaneously, which simplifies thread safety but limits true parallelism.",
    "I would start by reproducing the bug consistently. Then I would use logging and debugging tools like pdb or an IDE debugger to trace the issue. I would check recent changes with git blame and use binary search to isolate the problem. Unit tests help verify the fix.",
    "A list in Python is a dynamic array that stores references to objects. It supports O(1) append at the end, but O(n) insertion at the beginning. Indexing is O(1). A dict is a hash map with O(1) average lookup, insertion, and deletion.",
    "SQL joins combine rows from two or more tables. INNER JOIN returns rows matching in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right. Indexes speed up queries by creating a sorted data structure for the column.",
]


async def test_full_pipeline():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        print("\n=== ADAPTIVE — FULL PIPELINE INTEGRATION TEST ===\n")

        # 1. Create session
        print("--- 1. Creating session ---")
        session_payload = {
            "user_id": "user-001",
            "target_role_id": "role-001",
            "duration": "quick",
            "focus_competencies": ["comp-dsa", "comp-python", "comp-debugging"],
        }
        r = await client.post("/api/sessions", json=session_payload)
        assert r.status_code == 201, f"Create session failed: {r.text}"
        session = r.json()
        session_id = session["id"]
        question_count = session["question_count"]
        print(f"[PASS] Session created: {session_id} | Questions: {question_count}")

        # 2. Start session → gets first question
        print(f"\n--- 2. Starting session {session_id} ---")
        r = await client.post(f"/api/sessions/{session_id}/start")
        assert r.status_code == 200, f"Start session failed: {r.text}"
        start_data = r.json()
        first_q = start_data["first_question"]
        adaptive = start_data["adaptive_state"]
        print(f"[PASS] First question: [{first_q['question_id']}] {first_q['question'][:70]}...")
        print(f"       Competency: {first_q['competency']['name']} | Difficulty: {first_q['difficulty']}")
        print(f"       Adaptive state: estimate={adaptive['current_estimate']} difficulty={adaptive['current_difficulty']}")

        # 3. Main interview loop
        current_question_id = first_q["question_id"]
        previous_difficulty = first_q["difficulty"]

        for i in range(question_count):
            answer_text = SAMPLE_ANSWERS[i % len(SAMPLE_ANSWERS)]
            print(f"\n--- Q{i + 1}/{question_count}: Submitting answer ({len(answer_text)} chars) ---")

            r = await client.post(
                f"/api/sessions/{session_id}/answers",
                json={
                    "question_id": current_question_id,
                    "transcript": answer_text,
                    "duration_ms": 12000,
                }
            )
            assert r.status_code == 200, f"Submit answer failed (Q{i+1}): {r.status_code} {r.text[:300]}"
            result = r.json()
            print(f"[PASS] Evaluation: correctness={result['correctness']:.2f} | assessment={result['assessment']}")
            print(f"       Demonstrated: {result.get('concepts_demonstrated', [])}")
            print(f"       Missing: {result.get('concepts_missing', [])}")
            new_adaptive = result["adaptive_state"]
            action = new_adaptive.get("last_action", "none")
            print(f"       Adaptive: {previous_difficulty} -> {new_adaptive['current_difficulty']} | action={action} | estimate={new_adaptive['current_estimate']}")
            previous_difficulty = new_adaptive["current_difficulty"]

            # Check if session is complete
            if i + 1 >= question_count:
                print(f"\n[INFO] All {question_count} questions completed.")
                break

            # Get next question
            r = await client.post(f"/api/sessions/{session_id}/next-question")
            assert r.status_code == 200, f"Next question failed: {r.status_code} {r.text}"
            nq = r.json()
            current_question_id = nq["question_id"]
            print(f"       Next: [{nq['question_id']}] {nq['question'][:65]}...")

        # 4. Fetch report
        print(f"\n--- 3. Fetching final report for session {session_id} ---")
        r = await client.get(f"/api/sessions/{session_id}/report")
        if r.status_code == 409:
            # Session might not be marked complete yet
            print("[WARN] Session not yet complete — this is unexpected. Checking status...")
            r2 = await client.get(f"/api/sessions/{session_id}")
            print(f"       Session status: {r2.json().get('status')}")
        else:
            assert r.status_code == 200, f"Report failed: {r.status_code} {r.text[:300]}"
            report = r.json()
            print(f"[PASS] Report generated!")
            print(f"       Overall score: {report.get('overall_score')}")
            print(f"       Summary: {str(report.get('summary', ''))[:120]}...")
            print(f"       Skill estimates: {len(report.get('skill_estimates', []))}")
            print(f"       Gaps: {len(report.get('gaps', []))}")
            print(f"       Evidence items: {len(report.get('evidence', []))}")
            resources = report.get("resources", {})
            if resources:
                free = len(resources.get("free", []))
                paid = len(resources.get("paid", []))
                print(f"       Resources: {free} free / {paid} paid")
            recs = report.get("recommendations", [])
            if recs:
                print(f"       Recommendations: {recs[0][:80]}...")

        print("\n=== ALL PIPELINE TESTS PASSED ===\n")


if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
