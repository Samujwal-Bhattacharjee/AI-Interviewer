"""
app/models/answer.py — QuestionAttempt and AnswerEvidence ORM models.

Every answer submitted by a candidate is stored as a QuestionAttempt.
LLM evaluation produces AnswerEvidence items (concept coverage).

Graphiti:
  Answer -[PROVIDES_EVIDENCE]-> Competency
  Answer -[DEMONSTRATES]-> Concept
  Answer -[MISSES]-> Concept
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QuestionAttempt(Base):
    __tablename__ = "question_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("questions.id", ondelete="RESTRICT"), nullable=False
    )

    # The raw speech-to-text output
    transcript: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # Cleaned/formatted answer text (may differ from transcript)
    answer_text: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Correctness score (0.0 - 1.0) from LLM evaluation
    correctness: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    # Duration of the answer in milliseconds
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Difficulty of the question at the time of attempt
    difficulty_at_attempt: Mapped[str] = mapped_column(String(16), nullable=False, default="medium")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session: Mapped["AssessmentSession"] = relationship(back_populates="attempts")  # type: ignore[name-defined]
    question: Mapped["Question"] = relationship(back_populates="attempts")  # type: ignore[name-defined]
    evidence: Mapped[list["AnswerEvidence"]] = relationship(back_populates="attempt", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<QuestionAttempt id={self.id} session={self.session_id} correctness={self.correctness}>"


class AnswerEvidence(Base):
    """
    Individual concept coverage item from LLM evaluation.
    Records whether a candidate demonstrated, partially showed, or missed a concept.
    """

    __tablename__ = "answer_evidence"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("question_attempts.id", ondelete="CASCADE"), nullable=False
    )

    # The concept being evaluated (from InterviewQuestion.expected_concepts)
    concept: Mapped[str] = mapped_column(String(256), nullable=False)
    # demonstrated | partial | missing
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    # LLM explanation for the evaluation
    explanation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # Confidence of the LLM evaluation (0.0 - 1.0)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Relationship
    attempt: Mapped["QuestionAttempt"] = relationship(back_populates="evidence")

    def __repr__(self) -> str:
        return f"<AnswerEvidence concept={self.concept} status={self.status}>"
