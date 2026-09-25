"""
app/models/user.py — User ORM model.

Keeps user identity and their current target role.
Graphiti: User is the root node for all contextual relationships.
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"user-{uuid.uuid4().hex[:8]}")
    name: Mapped[str] = mapped_column(String(256), nullable=False, default="Anonymous")
    email: Mapped[str | None] = mapped_column(String(256), unique=True, nullable=True)

    # Current target role — drives gap analysis and skill comparison
    target_role_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("roles.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    sessions: Mapped[list["AssessmentSession"]] = relationship(back_populates="user")  # type: ignore[name-defined]
    skill_estimates: Mapped[list["SkillEstimate"]] = relationship(back_populates="user")  # type: ignore[name-defined]
    improvement_tasks: Mapped[list["ImprovementTask"]] = relationship(back_populates="user")  # type: ignore[name-defined]
    target_role: Mapped["Role | None"] = relationship(foreign_keys=[target_role_id])  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<User id={self.id} name={self.name}>"
