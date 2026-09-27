"""
backend/scripts/test_session_endpoints.py — Tests the required session endpoints.

Endpoints verified:
- GET /health
- POST /api/sessions
- POST /api/sessions/{id}/start
- POST /api/sessions/{id}/next-question
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import AsyncClient, ASGITransport
from app.main import app


async def test_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. GET /health
        print("\n--- 1. Testing GET /health ---")
        res_health = await client.get("/health")
        print(f"Status: {res_health.status_code}, Body: {res_health.json()}")
        assert res_health.status_code == 200
        assert res_health.json().get("status") == "ok"
        print("[PASS] GET /health")

        # 2. POST /api/sessions
        print("\n--- 2. Testing POST /api/sessions ---")
        session_payload = {
            "user_id": "user-001",
            "target_role_id": "role-001",
            "duration": "quick",
            "focus_competencies": ["comp-dsa", "comp-python"],
        }
        res_session = await client.post("/api/sessions", json=session_payload)
        print(f"Status: {res_session.status_code}, Body: {res_session.json()}")
        assert res_session.status_code == 201
        session_data = res_session.json()
        session_id = session_data["id"]
        assert session_id, "No session ID returned"
        assert session_data["status"] == "pending"
        print(f"[PASS] POST /api/sessions (session_id={session_id})")

        # 3. POST /api/sessions/{id}/start
        print(f"\n--- 3. Testing POST /api/sessions/{session_id}/start ---")
        res_start = await client.post(f"/api/sessions/{session_id}/start")
        print(f"Status: {res_start.status_code}, Body: {res_start.json()}")
        assert res_start.status_code == 200
        start_data = res_start.json()
        first_q = start_data.get("first_question")
        assert first_q is not None, "No first_question returned from /start"
        assert start_data.get("session")["status"] == "active"
        print(f"[PASS] POST /api/sessions/{session_id}/start (First question ID: {first_q['question_id']}, text: '{first_q['question'][:50]}...')")

        # 4. POST /api/sessions/{id}/next-question
        print(f"\n--- 4. Testing POST /api/sessions/{session_id}/next-question ---")
        res_next = await client.post(f"/api/sessions/{session_id}/next-question")
        print(f"Status: {res_next.status_code}, Body: {res_next.json()}")
        assert res_next.status_code == 200
        next_data = res_next.json()
        print(f"[PASS] POST /api/sessions/{session_id}/next-question (Question ID: {next_data.get('question_id')}, question: '{next_data.get('question')[:40]}...')")

        print("\n[ALL 4 ENDPOINTS PASSED SUCCESSFULLY!]")


if __name__ == "__main__":
    asyncio.run(test_endpoints())
