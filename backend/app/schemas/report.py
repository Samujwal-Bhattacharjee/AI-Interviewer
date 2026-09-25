"""app/schemas/report.py — Assessment report schemas."""
from datetime import datetime
from typing import Any, Optional

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


class CourseResourceSchema(BaseModel):
    id: str
    title: str
    provider: str
    skill: str
    resource_type: str
    difficulty: str
    estimated_duration: str
    price_type: str  # "free" | "paid"
    url: str
    reason: str
    priority: Optional[str] = None
    for_competency: Optional[str] = None


class ResourceRecommendationsSchema(BaseModel):
    free: list[CourseResourceSchema]
    paid: list[CourseResourceSchema]
    source: str = "curated"


class AssessmentReportSchema(BaseModel):
    session_id: str
    completed_at: datetime
    target_role_id: str
    overall_score: int
    summary: str
    skill_estimates: list[SkillEstimateSchema]
    gaps: list[GapAnalysisSchema]
    evidence: list[ReportEvidenceSchema]
    recommendations: list[str]  # text recommendations (legacy)
    resources: Optional[ResourceRecommendationsSchema] = None  # course recommendations
