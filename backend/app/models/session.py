"""
app/models/session.py — AssessmentSession ORM model.

One session = one complete assessment run for a user against a role.
Stores the adaptive engine's live state (current difficulty, search region, estimate).

Graphiti: User -[ATTEMPTED]-> AssessmentSession (temporal context)
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"session-{uuid.uuid4().hex[:8]}")
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    target_role_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False
    )

    # status: pending | active | completed | abandoned
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    # duration: quick | standard | deep
    duration: Mapped[str] = mapped_column(String(16), nullable=False, default="standard")

    question_count: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    current_question_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Focus competencies for this session
    focus_competencies: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    # Adaptive engine state — updated after every answer
    # current_difficulty: foundational | easy | medium | hard | expert
    adaptive_current_difficulty: Mapped[str] = mapped_column(String(16), nullable=False, default="medium")
    adaptive_search_lower: Mapped[str] = mapped_column(String(16), nullable=False, default="easy")
    adaptive_search_upper: Mapped[str] = mapped_column(String(16), nullable=False, default="hard")
    adaptive_last_action: Mapped[str | None] = mapped_column(String(32), nullable=True)
    adaptive_current_estimate: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    adaptive_evidence_analyzed: Mapped[bool] = mapped_column(default=False)

    # Question IDs attempted (to avoid repetition)
    attempted_question_ids: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="sessions")  # type: ignore[name-defined]
    role: Mapped["Role"] = relationship(back_populates="sessions")  # type: ignore[name-defined]
    attempts: Mapped[list["QuestionAttempt"]] = relationship(back_populates="session", cascade="all, delete-orphan")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<AssessmentSession id={self.id} user={self.user_id} status={self.status}>"
