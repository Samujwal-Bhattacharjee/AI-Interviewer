"""app/schemas/answer.py — Answer submission and evaluation schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel


class SubmitAnswerRequest(BaseModel):
    question_id: str
    transcript: str
    duration_ms: int = 0


class AnswerEvidenceSchema(BaseModel):
    concept: str
    status: str  # demonstrated | partial | missing
    explanation: str
    confidence: float

    model_config = {"from_attributes": True}


class SkillEstimateSchema(BaseModel):
    competency_id: str
    score: int
    confidence: float
    confidence_level: str  # low | medium | high
    evidence_count: int
    estimated_level: str
    trend: str  # up | down | stable
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdaptiveStateSchema(BaseModel):
    current_difficulty: str
    search_region: dict[str, str]  # {lower: ..., upper: ...}
    last_action: str | None
    evidence_analyzed: bool
    current_estimate: int


class SubmitAnswerResponse(BaseModel):
    attempt_id: uuid.UUID
    question_id: str
    correctness: float
    assessment: str = "partial"  # demonstrated | partial | missing
    confidence: float = 0.85
    concepts_demonstrated: list[str] = []
    concepts_missing: list[str] = []
    evidence: list[AnswerEvidenceSchema]
    updated_skill_estimates: list[SkillEstimateSchema]
    adaptive_state: AdaptiveStateSchema
