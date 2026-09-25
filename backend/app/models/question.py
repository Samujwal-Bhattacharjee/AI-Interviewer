"""
app/models/question.py — Question ORM model.

PostgreSQL is the canonical source of all interview questions.
The adaptive engine selects from this table; it never invents questions.

Graphiti: Question -[TESTS]-> Competency
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    competency_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("competencies.id", ondelete="RESTRICT"), nullable=False
    )

    # difficulty: foundational | easy | medium | hard | expert
    difficulty: Mapped[str] = mapped_column(String(16), nullable=False)
    # question_type: conceptual | analytical | applied | behavioral | technical
    question_type: Mapped[str] = mapped_column(String(32), nullable=False)

    question: Mapped[str] = mapped_column(Text, nullable=False)
    expected_concepts: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    follow_up_prompts: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    # Active flag — soft delete instead of destroying question history
    is_active: Mapped[bool] = mapped_column(default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    competency: Mapped["Competency"] = relationship(back_populates="questions")  # type: ignore[name-defined]
    attempts: Mapped[list["QuestionAttempt"]] = relationship(back_populates="question")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Question id={self.id} competency={self.competency_id} difficulty={self.difficulty}>"
