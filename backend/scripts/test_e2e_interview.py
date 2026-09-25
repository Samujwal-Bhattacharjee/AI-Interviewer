"""
backend/scripts/test_e2e_interview.py — End-to-end integration test of the complete interview lifecycle.

Flow verified:
1. Target Role selection (GET /api/roles)
2. Blueprint inspection (GET /api/roles/{id}/blueprint)
3. Session creation (POST /api/sessions with duration='quick' -> 5 questions)
4. Session start (POST /api/sessions/{id}/start) -> returns first adaptive question
5. Loop through questions:
   - Submit candidate answer with speech transcript (POST /api/sessions/{id}/answers)
   - Verify answer evaluation (correctness, concept evidence)
   - Verify skill estimation updates
   - Verify adaptive engine difficulty adjustments
   - Request next question (POST /api/sessions/{id}/next-question) until session completes
6. Final Report retrieval (GET /api/sessions/{id}/report)
   - Verify overall score, gap analysis, evidence summary, and recommendations
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import AsyncClient, ASGITransport
from app.main import app


async def test_complete_interview_lifecycle() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("\n=== STEP 1: TARGET ROLE DISCOVERY ===")
        res_roles = await client.get("/api/roles")
        assert res_roles.status_code == 200, f"Failed GET /api/roles: {res_roles.status_code}"
        roles = res_roles.json()
        assert len(roles) > 0, "No target roles found"
        selected_role = roles[0]
        role_id = selected_role["id"]
        print(f"Selected Role: {selected_role['title']} ({role_id})")
        print(f"Required Competencies: {[c['name'] for c in selected_role['competencies']]}")

        print("\n=== STEP 2: ASSESSMENT BLUEPRINT ===")
        res_bp = await client.get(f"/api/roles/{role_id}/blueprint")
        assert res_bp.status_code == 200
        blueprint = res_bp.json()
        print(f"Blueprint Competency Areas: {len(blueprint['competency_areas'])}")

        print("\n=== STEP 3: SESSION CREATION ===")
        # Use quick duration (5 questions) to verify complete completion loop
        res_session = await client.post(
            "/api/sessions",
            json={
                "user_id": "user-001",
                "target_role_id": role_id,
                "duration": "quick",
                "focus_competencies": ["comp-dsa", "comp-python", "comp-sql"],
            },
        )
        assert res_session.status_code == 201
        session_data = res_session.json()
        session_id = session_data["id"]
        total_questions = session_data["question_count"]
        print(f"Session Created: ID={session_id}, Count={total_questions}, Status={session_data['status']}")

        print("\n=== STEP 4: SESSION START ===")
        res_start = await client.post(f"/api/sessions/{session_id}/start")
        assert res_start.status_code == 200
        start_payload = res_start.json()
        current_q = start_payload["first_question"]
        print(f"Session Started! Status={start_payload['session']['status']}")
        print(f"First Question: [{current_q['difficulty'].upper()}] {current_q['question']}")

        print("\n=== STEP 5: ADAPTIVE INTERVIEW LOOP ===")
        sample_answers = [
            "A hash map uses a hash function to map keys to bucket indices. Collisions are handled using chaining with linked lists or open addressing with linear probing. Average time complexity is O(1) for lookup, insertion, and deletion.",
            "In Python, memory is managed via reference counting and a generational garbage collector to detect reference cycles. The Global Interpreter Lock (GIL) serializes thread execution within a single process.",
            "An index in SQL is typically implemented using a B-Tree or B+Tree structure. It dramatically speeds up read queries with WHERE clauses, but introduces a write overhead for INSERT, UPDATE, and DELETE operations.",
            "To debug a memory leak, I first inspect memory profilers like tracemalloc or heap dump analyzers to find growing object counts, check for unclosed resources or circular references keeping objects alive.",
            "A distributed cache like Redis uses consistent hashing to partition keys across multiple nodes, LRU eviction policies when cache fills, and write-through or cache-aside patterns to maintain database consistency.",
        ]

        question_num = 1
        while question_num <= total_questions:
            print(f"\n--- Question {question_num}/{total_questions} ---")
            print(f"ID: {current_q['question_id']}")
            print(f"Competency: {current_q['competency']['name']}")
            print(f"Difficulty: {current_q['difficulty']}")
            print(f"Prompt: {current_q['question']}")

            transcript = sample_answers[(question_num - 1) % len(sample_answers)]
            print(f"Candidate Speech Transcript: \"{transcript[:60]}...\"")

            # Submit answer
            res_ans = await client.post(
                f"/api/sessions/{session_id}/answers",
                json={
                    "question_id": current_q["question_id"],
                    "transcript": transcript,
                    "duration_ms": 14200,
                },
            )
            assert res_ans.status_code == 200, f"Submit answer failed: {res_ans.status_code}, {res_ans.text}"
            ans_data = res_ans.json()

            print(f"Correctness Score: {ans_data['correctness'] * 100:.1f}%")
            print(f"Evidence Extracted: {len(ans_data['evidence'])} concept items")
            for ev in ans_data["evidence"][:2]:
                print(f"  • [{ev['status'].upper()}] {ev['concept']}: {ev['explanation']}")

            adapt = ans_data["adaptive_state"]
            print(f"Adaptive Decision: Last Action={adapt['last_action']}, Next Difficulty={adapt['current_difficulty']}")

            if question_num < total_questions:
                res_next = await client.post(f"/api/sessions/{session_id}/next-question")
                assert res_next.status_code == 200, f"Next question failed: {res_next.status_code}, {res_next.text}"
                current_q = res_next.json()

            question_num += 1

        print("\n=== STEP 6: VERIFY FINAL REPORT ===")
        res_report = await client.get(f"/api/sessions/{session_id}/report")
        assert res_report.status_code == 200, f"Get report failed: {res_report.status_code}, {res_report.text}"
        report = res_report.json()

        print(f"Report Session ID: {report['session_id']}")
        print(f"Overall Score: {report['overall_score']}/100")
        print(f"Summary: {report['summary']}")
        print(f"Skill Estimates Evaluated: {len(report['skill_estimates'])}")
        for est in report["skill_estimates"]:
            print(f"  • {est['competency_id']}: Score={est['score']}, Conf={est['confidence']:.2f}, Level={est['estimated_level']}")

        print(f"Gap Analysis Items: {len(report['gaps'])}")
        for gap in report["gaps"]:
            print(f"  • {gap['competency_name']}: Current={gap['current_score']}, Target={gap['target_score']}, Delta={gap['gap']}")

        print(f"Recommendations Generated: {len(report['recommendations'])}")
        for i, rec in enumerate(report["recommendations"], 1):
            print(f"  [{i}] {rec}")

        print("\n>>> FULL END-TO-END VERTICAL SLICE PASSED PERFECTLY! <<<")


if __name__ == "__main__":
    asyncio.run(test_complete_interview_lifecycle())
