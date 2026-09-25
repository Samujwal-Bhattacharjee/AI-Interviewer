"""
backend/scripts/test_endpoints.py — Comprehensive verification script for backend endpoints.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.graphiti_service import graphiti_service


async def main() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health
        res_health = await client.get("/health")
        assert res_health.status_code == 200, f"Health check failed: {res_health.status_code}"
        print("CHECK 1: /health -> 200 OK:", res_health.json())

        # 2. /docs
        res_docs = await client.get("/docs")
        assert res_docs.status_code == 200, f"/docs failed: {res_docs.status_code}"
        print("CHECK 2: /docs -> 200 OK (Swagger UI loaded)")

        # 3. GET /api/roles
        res_roles = await client.get("/api/roles")
        assert res_roles.status_code == 200, f"GET /api/roles failed: {res_roles.status_code}"
        roles = res_roles.json()
        assert len(roles) > 0, "No roles returned"
        role_id = roles[0]["id"]
        print(f"CHECK 3: GET /api/roles -> 200 OK ({len(roles)} roles available, first: '{role_id}')")

        # 4. GET /api/roles/{id}/blueprint
        res_bp = await client.get(f"/api/roles/{role_id}/blueprint")
        assert res_bp.status_code == 200, f"GET /api/roles/{role_id}/blueprint failed: {res_bp.status_code}"
        bp = res_bp.json()
        areas = bp.get("competency_areas", [])
        assert len(areas) > 0, f"No competency_areas returned in blueprint: {bp}"
        print(f"CHECK 4: GET /api/roles/{role_id}/blueprint -> 200 OK ({len(areas)} competency areas defined)")

        # 5. POST /api/sessions
        session_payload = {
            "user_id": "user-001",
            "target_role_id": role_id,
            "duration": "standard",
            "focus_competencies": ["comp-dsa", "comp-python"],
        }
        res_sess = await client.post("/api/sessions", json=session_payload)
        assert res_sess.status_code == 201, f"POST /api/sessions failed: {res_sess.status_code}, {res_sess.text}"
        sess_data = res_sess.json()
        session_id = sess_data["id"]
        print(f"CHECK 5: POST /api/sessions -> 201 Created (session_id: '{session_id}', status: '{sess_data['status']}')")

        # 6. POST /api/sessions/{id}/start
        res_start = await client.post(f"/api/sessions/{session_id}/start")
        assert res_start.status_code == 200, f"POST /api/sessions/{session_id}/start failed: {res_start.status_code}, {res_start.text}"
        start_data = res_start.json()
        first_q = start_data["first_question"]
        print(f"CHECK 6: POST /api/sessions/{session_id}/start -> 200 OK (question_id: '{first_q['question_id']}', competency: '{first_q['competency']['name']}')")

        # 7. Graphiti service check
        print(f"CHECK 7: Graphiti service status: available={graphiti_service.is_available}")
        # Test calling methods when disconnected to verify graceful no-op
        res_ctx = await graphiti_service.add_assessment_context("user-001", session_id, role_id, "Junior Software Engineer")
        assert res_ctx is False or res_ctx is True
        print("CHECK 8: Graphiti add_assessment_context handled gracefully (returned without exception)")
        results = await graphiti_service.search_user_context("user-001", "debugging")
        assert results == []
        print("CHECK 9: Graphiti search_user_context returned empty list without exception")

    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(main())
