"""app/schemas/role.py — Role and Competency Pydantic schemas."""
from pydantic import BaseModel


class CompetencySchema(BaseModel):
    id: str
    name: str
    category: str
    description: str
    subskills: list[str]

    model_config = {"from_attributes": True}


class CompetencyRequirementSchema(BaseModel):
    competency_id: str
    target_level: int
    importance: str  # critical | high | medium | low

    model_config = {"from_attributes": True}


class TargetRoleSchema(BaseModel):
    id: str
    title: str
    level: str
    description: str
    technologies: list[str]
    responsibilities: list[str]
    requirements: list[CompetencyRequirementSchema]
    competencies: list[CompetencySchema]

    model_config = {"from_attributes": True}


class CompetencyAreaSchema(BaseModel):
    competency_id: str
    concepts: list[str]
    question_areas: list[str]
    difficulty_range: dict[str, int]


class RoleBlueprintSchema(BaseModel):
    role_id: str
    competency_areas: list[CompetencyAreaSchema]
    estimated_questions: int
    focus_areas: list[str]
