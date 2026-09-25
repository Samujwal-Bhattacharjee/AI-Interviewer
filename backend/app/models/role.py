"""
app/models/role.py — Role, Competency, and RoleCompetency ORM models.

PostgreSQL is the canonical source of truth for:
  - Available target roles
  - Competency definitions
  - Target level requirements per role per competency

Graphiti context: User -[HAS_TARGET]-> Role (temporal, tracks changes)
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Competency(Base):
    __tablename__ = "competencies"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # PostgreSQL ARRAY for subskills list
    subskills: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    role_competencies: Mapped[list["RoleCompetency"]] = relationship(back_populates="competency")
    questions: Mapped[list["Question"]] = relationship(back_populates="competency")  # type: ignore[name-defined]
    skill_estimates: Mapped[list["SkillEstimate"]] = relationship(back_populates="competency")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Competency id={self.id} name={self.name}>"


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    level: Mapped[str] = mapped_column(String(32), nullable=False)  # beginner/junior/intermediate/senior
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    technologies: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    responsibilities: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    requirements: Mapped[list["RoleCompetency"]] = relationship(
        back_populates="role", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["AssessmentSession"]] = relationship(back_populates="role")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Role id={self.id} title={self.title}>"


class RoleCompetency(Base):
    """Join table: maps a Role to a Competency with target level and importance."""

    __tablename__ = "role_competencies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    role_id: Mapped[str] = mapped_column(String(64), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    competency_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("competencies.id", ondelete="CASCADE"), nullable=False
    )
    # Target level (0-100) the role requires for this competency
    target_level: Mapped[int] = mapped_column(nullable=False, default=70)
    # Importance of this competency to the role
    importance: Mapped[str] = mapped_column(String(16), nullable=False, default="medium")  # critical/high/medium/low

    # Relationships
    role: Mapped["Role"] = relationship(back_populates="requirements")
    competency: Mapped["Competency"] = relationship(back_populates="role_competencies")

    def __repr__(self) -> str:
        return f"<RoleCompetency role={self.role_id} comp={self.competency_id} target={self.target_level}>"
