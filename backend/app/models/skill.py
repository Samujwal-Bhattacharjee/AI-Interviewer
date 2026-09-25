"""
app/models/skill.py — SkillEstimate and SkillHistory ORM models.

SkillEstimate: current best estimate of a user's competency level.
  Updated after every answer evaluation.
  The adaptive engine owns this calculation.
  Frontend ONLY displays this value — never computes it.

SkillHistory: time-series record of estimate changes across sessions.
  PostgreSQL holds the raw records.
  Graphiti holds the temporal relationships and contextual narrative.

Graphiti:
  User -[HAS_SKILL_ESTIMATE]-> Competency (current)
  User -[HAS_SKILL_AT]-> SkillSnapshot (versioned, per-session)
  SkillSnapshot -[IN_SESSION]-> AssessmentSession
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SkillEstimate(Base):
    __tablename__ = "skill_estimates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    competency_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("competencies.id", ondelete="RESTRICT"), nullable=False
    )

    # Score: 0-100 (the adaptive engine's estimate)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    # Confidence: 0.0-1.0 (how certain we are of the estimate)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    # confidence_level: low | medium | high (bucketed)
    confidence_level: Mapped[str] = mapped_column(String(8), nullable=False, default="low")
    # Number of answer pieces of evidence used in the estimate
    evidence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # estimated_level: novice | foundational | developing | proficient | advanced | expert
    estimated_level: Mapped[str] = mapped_column(String(16), nullable=False, default="novice")
    # trend: up | down | stable
    trend: Mapped[str] = mapped_column(String(8), nullable=False, default="stable")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="skill_estimates")  # type: ignore[name-defined]
    competency: Mapped["Competency"] = relationship(back_populates="skill_estimates")  # type: ignore[name-defined]
    history: Mapped[list["SkillHistory"]] = relationship(back_populates="estimate", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<SkillEstimate user={self.user_id} comp={self.competency_id} score={self.score}>"


class SkillHistory(Base):
    """
    Immutable record of a skill estimate at a specific point in time (per session).
    Used to drive temporal trajectory charts and Graphiti context.
    """

    __tablename__ = "skill_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    estimate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skill_estimates.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("assessment_sessions.id", ondelete="SET NULL"), nullable=True
    )

    score: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    evidence_count: Mapped[int] = mapped_column(Integer, nullable=False)

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    estimate: Mapped["SkillEstimate"] = relationship(back_populates="history")

    def __repr__(self) -> str:
        return f"<SkillHistory estimate={self.estimate_id} score={self.score} ts={self.timestamp}>"
