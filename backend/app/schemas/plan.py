"""app/schemas/plan.py — Improvement plan schemas."""
from datetime import datetime

from pydantic import BaseModel


class ImprovementTaskSchema(BaseModel):
    id: str
    competency_id: str
    title: str
    description: str
    observed_weakness: str
    estimated_time: str
    priority: str
    completed: bool
    success_criteria: list[str]

    model_config = {"from_attributes": True}


class ImprovementPlanSchema(BaseModel):
    user_id: str
    generated_at: datetime
    focus_competencies: list[str]
    estimated_improvement: int
    tasks: list[ImprovementTaskSchema]
