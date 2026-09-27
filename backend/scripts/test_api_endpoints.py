"""
backend/scripts/test_api_endpoints.py — Verifies the complete session lifecycle via HTTP:
1. GET /health
2. GET /api/roles
3. POST /api/sessions (Create session)
4. POST /api/sessions/{id}/start (Start session and retrieve first question)
5. POST /api/sessions/{id}/next-question (Retrieve next question)
"""
import json
import urllib.request
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

BASE_URL = "http://localhost:8000"

def request(method: str, path: str, data: dict | None = None) -> dict:
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    body = json.dumps(data).encode("utf-8") if data else None
    with urllib.request.urlopen(req, data=body, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("Testing Backend API Endpoints against running FastAPI server...")
    
    # 1. Health
    print("\n1. Testing GET /health...")
    health = request("GET", "/health")
    print(f"   Response: {health}")
    assert health.get("status") == "ok", f"Health status not ok: {health}"
    print("   [PASS] /health is OK")

    # 2. Roles
    print("\n2. Testing GET /api/roles...")
    roles = request("GET", "/api/roles")
    print(f"   Found {len(roles)} roles in database")
    assert len(roles) > 0, "No roles found"
    first_role_id = roles[0]["id"]
    print(f"   First role: {first_role_id} ({roles[0].get('title')})")
    print("   [PASS] /api/roles is OK")

    # 3. Create Session
    print("\n3. Testing POST /api/sessions...")
    session_payload = {
        "user_id": "user-001",
        "target_role_id": first_role_id,
        "duration": "quick",
        "interview_mode": "standard",
        "target_language": "en-US",
    }
    created = request("POST", "/api/sessions", session_payload)
    session_id = created["id"]
    print(f"   Created session: {session_id} with status: {created.get('status')}")
    assert created.get("status") == "pending", f"Unexpected status: {created.get('status')}"
    print("   [PASS] POST /api/sessions is OK")

    # 4. Start Session
    print(f"\n4. Testing POST /api/sessions/{session_id}/start...")
    started = request("POST", f"/api/sessions/{session_id}/start")
    first_q = started.get("first_question", {})
    first_q_id = first_q.get("question_id")
    print(f"   Session started! First question ID: {first_q_id}")
    print(f"   Question text: {first_q.get('question')}")
    print(f"   Session status: {started.get('session', {}).get('status')}")
    assert first_q_id is not None, "First question was not returned"
    print("   [PASS] POST /api/sessions/{id}/start is OK")

    # 5. Next Question
    print(f"\n5. Testing POST /api/sessions/{session_id}/next-question...")
    next_q = request("POST", f"/api/sessions/{session_id}/next-question")
    next_q_id = next_q.get("question_id")
    print(f"   Next question ID: {next_q_id}")
    print(f"   Question text: {next_q.get('question')}")
    assert next_q_id is not None, "Next question was not returned"
    print("   [PASS] POST /api/sessions/{id}/next-question is OK")

    # 6. Verify assessment_sessions DB record directly
    print(f"\n6. Verifying database record for session {session_id}...")
    import asyncio
    from app.database import engine
    from sqlalchemy import text
    async def verify_db():
        async with engine.connect() as conn:
            stmt = text("SELECT id, status, current_question_id, current_question_index, interview_mode, target_language FROM assessment_sessions WHERE id = :sid")
            row = (await conn.execute(stmt, {"sid": session_id})).mappings().first()
            print(f"   Database row: {dict(row)}")
            assert row is not None, "Session row not found in DB"
            assert row["current_question_id"] == "q-001", f"current_question_id expected 'q-001', got {row['current_question_id']}"
            print("   [PASS] DB record and current_question_id verified!")
    asyncio.run(verify_db())

    print("\n========================================")
    print("ALL 5 API ENDPOINT VERIFICATIONS PASSED!")
    print("========================================")

if __name__ == "__main__":
    main()
