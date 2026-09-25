"""app/schemas/session.py — Session creation and state schemas."""
from datetime import datetime

from pydantic import BaseModel

from app.schemas.answer import AdaptiveStateSchema, SkillEstimateSchema


class CreateSessionRequest(BaseModel):
    user_id: str
    target_role_id: str
    level: str = "junior"
    focus_competencies: list[str] = []
    duration: str = "standard"  # quick | standard | deep


class AssessmentSessionSchema(BaseModel):
    id: str
    user_id: str
    target_role_id: str
    started_at: datetime
    completed_at: datetime | None
    status: str
    question_count: int
    current_question_index: int
    focus_competencies: list[str]
    duration: str

    model_config = {"from_attributes": True}


class SessionStateSchema(BaseModel):
    session_id: str
    status: str
    current_question_index: int
    total_questions: int
    adaptive_state: AdaptiveStateSchema
    skill_estimates: list[SkillEstimateSchema]


class StartSessionResponse(BaseModel):
    session: AssessmentSessionSchema
    first_question: "NextQuestionResponse"  # type: ignore[name-defined]
    adaptive_state: AdaptiveStateSchema


# Avoid circular import — import NextQuestionResponse lazily
from app.schemas.question import NextQuestionResponse  # noqa: E402
StartSessionResponse.model_rebuild()
