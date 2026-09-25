"""
backend/scripts/verify_persistence.py — Verifies database persistence of session data.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.session import AssessmentSession
from app.models.answer import QuestionAttempt, AnswerEvidence
from app.models.skill import SkillEstimate, SkillHistory


async def verify() -> None:
    async with AsyncSessionLocal() as db:
        # 1. Total sessions
        result = await db.execute(select(func.count()).select_from(AssessmentSession))
        session_count = result.scalar()
        print(f"[OK] Total AssessmentSessions in PostgreSQL: {session_count}")
        assert session_count > 0, "No sessions persisted"

        # 2. Latest session
        result = await db.execute(
            select(AssessmentSession).order_by(AssessmentSession.started_at.desc()).limit(1)
        )
        latest_session = result.scalar_one()
        print(f"[OK] Latest Session: ID={latest_session.id}, Status={latest_session.status}, Role={latest_session.target_role_id}")
        assert latest_session.status in ["active", "completed"]

        # 3. Question attempts
        result = await db.execute(
            select(QuestionAttempt).where(QuestionAttempt.session_id == latest_session.id)
        )
        attempts = result.scalars().all()
        print(f"[OK] Persisted QuestionAttempts for latest session: {len(attempts)}")
        assert len(attempts) > 0, "No attempts persisted"

        # 4. Evidence items
        attempt_ids = [a.id for a in attempts]
        result = await db.execute(
            select(AnswerEvidence).where(AnswerEvidence.attempt_id.in_(attempt_ids))
        )
        evidence_items = result.scalars().all()
        print(f"[OK] Persisted AnswerEvidence records: {len(evidence_items)}")
        assert len(evidence_items) > 0, "No evidence persisted"

        # 5. Skill estimates
        result = await db.execute(
            select(SkillEstimate).where(SkillEstimate.user_id == latest_session.user_id)
        )
        estimates = result.scalars().all()
        print(f"[OK] Persisted SkillEstimates for user '{latest_session.user_id}': {len(estimates)}")
        assert len(estimates) > 0, "No skill estimates persisted"

        # 6. Skill history points
        result = await db.execute(
            select(SkillHistory).where(SkillHistory.session_id == latest_session.id)
        )
        history_points = result.scalars().all()
        print(f"[OK] Persisted SkillHistory trajectory records: {len(history_points)}")
        assert len(history_points) > 0, "No skill history persisted"

        print("\nALL DATABASE PERSISTENCE CHECKS VERIFIED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(verify())
