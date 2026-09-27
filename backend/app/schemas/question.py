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
    question_text: str = ""
    localized_question_text: str | None = None
    question_language: str = "en-IN"
    expected_concepts: list[str]
    follow_up_prompts: list[str]
    question_number: int
    total_questions: int
    question_translated: str | None = None
    target_language: str = "en-US"
    interview_mode: str = "standard"

