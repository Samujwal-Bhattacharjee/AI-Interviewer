"""
app/routers/reassess.py — Targeted reassessment endpoint.

POST /api/reassess
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.session import AssessmentSession
from app.schemas.session import AssessmentSessionSchema
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["reassessment"])


class ReassessRequest(BaseModel):
    user_id: str
    target_role_id: str
    focus_competencies: list[str]
    duration: str = "quick"


class ReassessResponse(BaseModel):
    session_id: str
    focus_competencies: list[str]
    question_count: int
    status: str


@router.post("/reassess", response_model=ReassessResponse, status_code=201)
async def start_reassessment(
    body: ReassessRequest,
    db: AsyncSession = Depends(get_db),
) -> ReassessResponse:
    """
    Creates a targeted reassessment session focused only on weak competencies.
    Does not restart the full assessment — only covers the focus areas.
    """
    question_count = {"quick": 5, "standard": 10, "deep": 20}.get(body.duration, 5)

    session = AssessmentSession(
        user_id=body.user_id,
        target_role_id=body.target_role_id,
        duration=body.duration,
        question_count=question_count,
        focus_competencies=body.focus_competencies,
        status="pending",
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)

    return ReassessResponse(
        session_id=session.id,
        focus_competencies=body.focus_competencies,
        question_count=question_count,
        status="pending",
    )
