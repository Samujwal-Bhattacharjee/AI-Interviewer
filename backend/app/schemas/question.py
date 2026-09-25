"""app/schemas/question.py — Interview question response schemas."""
from pydantic import BaseModel


class CompetencyRefSchema(BaseModel):
    id: str
    name: str


class InterviewQuestionSchema(BaseModel):
    id: str
    competency_id: str
    difficulty: str
    question_type: str
    question: str
    expected_concepts: list[str]
    follow_up_prompts: list[str]

    model_config = {"from_attributes": True}


class NextQuestionResponse(BaseModel):
    """Response to POST /api/sessions/{id}/next-question."""
    question_id: str
    competency: CompetencyRefSchema
    difficulty: str
    question_type: str
    question: str
    expected_concepts: list[str]
    follow_up_prompts: list[str]
    question_number: int
    total_questions: int
