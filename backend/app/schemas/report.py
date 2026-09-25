"""app/schemas/report.py — Assessment report schemas."""
from datetime import datetime

from pydantic import BaseModel

from app.schemas.answer import AnswerEvidenceSchema, SkillEstimateSchema
from app.schemas.skill import GapAnalysisSchema


class ReportEvidenceSchema(BaseModel):
    question_id: str
    competency_id: str
    concept: str
    status: str
    explanation: str
    confidence: float


class AssessmentReportSchema(BaseModel):
    session_id: str
    completed_at: datetime
    target_role_id: str
    overall_score: int
    summary: str
    skill_estimates: list[SkillEstimateSchema]
    gaps: list[GapAnalysisSchema]
    evidence: list[ReportEvidenceSchema]
    recommendations: list[str]
