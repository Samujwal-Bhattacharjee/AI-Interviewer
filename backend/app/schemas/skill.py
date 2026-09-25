"""app/schemas/skill.py — Skill profile and gap analysis schemas."""
from datetime import datetime

from pydantic import BaseModel


class SkillHistoryPointSchema(BaseModel):
    session_id: str | None
    score: int
    confidence: float
    evidence_count: int
    timestamp: datetime

    model_config = {"from_attributes": True}


class SkillWithHistorySchema(BaseModel):
    """Skill estimate enriched with temporal history."""
    competency_id: str
    score: int
    confidence: float
    confidence_level: str
    evidence_count: int
    estimated_level: str
    trend: str
    updated_at: datetime
    history: list[SkillHistoryPointSchema] = []

    model_config = {"from_attributes": True}


class GapAnalysisSchema(BaseModel):
    competency_id: str
    competency_name: str
    current_score: int
    target_score: int
    gap: int  # negative = below target
    priority: str  # critical | high | medium | low


class UserStatsSchema(BaseModel):
    user_id: str
    sessions_completed: int
    target_role_id: str | None
    target_role_title: str | None
    last_session_at: datetime | None
