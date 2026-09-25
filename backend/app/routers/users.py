"""
app/routers/users.py — User skill profile and stats endpoints.

GET /api/users/{user_id}/skills
GET /api/users/{user_id}/skills/{competency_id}
GET /api/users/{user_id}/skills/history
GET /api/users/{user_id}/gaps?role_id={role_id}
GET /api/users/{user_id}/stats
GET /api/users/{user_id}/plan
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.plan import ImprovementTask
from app.models.role import RoleCompetency
from app.models.session import AssessmentSession
from app.models.skill import SkillEstimate, SkillHistory
from app.models.user import User
from app.schemas.answer import SkillEstimateSchema
from app.schemas.plan import ImprovementPlanSchema, ImprovementTaskSchema
from app.schemas.skill import GapAnalysisSchema, SkillHistoryPointSchema, SkillWithHistorySchema, UserStatsSchema

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/{user_id}/skills", response_model=list[SkillEstimateSchema])
async def get_skills(user_id: str, db: AsyncSession = Depends(get_db)) -> list[SkillEstimateSchema]:
    """Returns all current skill estimates for a user."""
    result = await db.execute(
        select(SkillEstimate).where(SkillEstimate.user_id == user_id)
    )
    estimates = result.scalars().all()
    return [SkillEstimateSchema.model_validate(e) for e in estimates]


@router.get("/{user_id}/skills/history", response_model=list[SkillWithHistorySchema])
async def get_skill_history(user_id: str, db: AsyncSession = Depends(get_db)) -> list[SkillWithHistorySchema]:
    """Returns skill estimates enriched with temporal history."""
    result = await db.execute(
        select(SkillEstimate)
        .where(SkillEstimate.user_id == user_id)
        .options(selectinload(SkillEstimate.history))
    )
    estimates = result.scalars().all()

    schemas = []
    for est in estimates:
        history_points = [
            SkillHistoryPointSchema(
                session_id=h.session_id,
                score=h.score,
                confidence=h.confidence,
                evidence_count=h.evidence_count,
                timestamp=h.timestamp,
            )
            for h in sorted(est.history, key=lambda h: h.timestamp)
        ]
        schemas.append(SkillWithHistorySchema(
            competency_id=est.competency_id,
            score=est.score,
            confidence=est.confidence,
            confidence_level=est.confidence_level,
            evidence_count=est.evidence_count,
            estimated_level=est.estimated_level,
            trend=est.trend,
            updated_at=est.updated_at,
            history=history_points,
        ))
    return schemas


@router.get("/{user_id}/skills/{competency_id}", response_model=SkillEstimateSchema)
async def get_skill(
    user_id: str, competency_id: str, db: AsyncSession = Depends(get_db)
) -> SkillEstimateSchema:
    """Returns a single skill estimate."""
    result = await db.execute(
        select(SkillEstimate)
        .where(SkillEstimate.user_id == user_id, SkillEstimate.competency_id == competency_id)
    )
    estimate = result.scalar_one_or_none()
    if not estimate:
        raise HTTPException(status_code=404, detail="Skill estimate not found")
    return SkillEstimateSchema.model_validate(estimate)


@router.get("/{user_id}/gaps", response_model=list[GapAnalysisSchema])
async def get_gaps(
    user_id: str,
    role_id: str = Query(..., description="Target role ID for comparison"),
    db: AsyncSession = Depends(get_db),
) -> list[GapAnalysisSchema]:
    """Returns gap analysis: user's current skills vs role requirements."""
    # Get skill estimates
    result = await db.execute(
        select(SkillEstimate).where(SkillEstimate.user_id == user_id)
    )
    estimates = {e.competency_id: e for e in result.scalars().all()}

    # Get role requirements with competency names
    result = await db.execute(
        select(RoleCompetency)
        .where(RoleCompetency.role_id == role_id)
        .options(selectinload(RoleCompetency.competency))
    )
    requirements = result.scalars().all()

    gaps = []
    for req in requirements:
        est = estimates.get(req.competency_id)
        current_score = est.score if est else 0
        gap = current_score - req.target_level
        priority = "critical" if gap < -20 else "high" if gap < -10 else "medium" if gap < 0 else "low"

        gaps.append(GapAnalysisSchema(
            competency_id=req.competency_id,
            competency_name=req.competency.name if req.competency else req.competency_id,
            current_score=current_score,
            target_score=req.target_level,
            gap=gap,
            priority=priority,
        ))

    return sorted(gaps, key=lambda g: g.gap)  # worst gaps first


@router.get("/{user_id}/stats", response_model=UserStatsSchema)
async def get_stats(user_id: str, db: AsyncSession = Depends(get_db)) -> UserStatsSchema:
    """Returns user summary stats."""
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Count completed sessions
    count_result = await db.execute(
        select(func.count(AssessmentSession.id))
        .where(AssessmentSession.user_id == user_id, AssessmentSession.status == "completed")
    )
    sessions_completed = count_result.scalar_one() or 0

    # Last session
    last_result = await db.execute(
        select(AssessmentSession.started_at)
        .where(AssessmentSession.user_id == user_id)
        .order_by(AssessmentSession.started_at.desc())
        .limit(1)
    )
    last_session_at = last_result.scalar_one_or_none()

    # Target role title
    target_role_title = None
    if user.target_role and hasattr(user, "target_role"):
        target_role_title = user.target_role.title

    return UserStatsSchema(
        user_id=user_id,
        sessions_completed=sessions_completed,
        target_role_id=user.target_role_id,
        target_role_title=target_role_title,
        last_session_at=last_session_at,
    )


@router.get("/{user_id}/plan", response_model=ImprovementPlanSchema)
async def get_plan(user_id: str, db: AsyncSession = Depends(get_db)) -> ImprovementPlanSchema:
    """Returns the user's current improvement plan."""
    result = await db.execute(
        select(ImprovementTask)
        .where(ImprovementTask.user_id == user_id, ImprovementTask.completed == False)  # noqa: E712
        .order_by(ImprovementTask.created_at.desc())
    )
    tasks = result.scalars().all()

    focus_competencies = list({t.competency_id for t in tasks})

    from datetime import datetime
    return ImprovementPlanSchema(
        user_id=user_id,
        generated_at=tasks[0].created_at if tasks else datetime.utcnow(),
        focus_competencies=focus_competencies,
        estimated_improvement=len(tasks) * 5,  # placeholder; Phase 2K uses LLM
        tasks=[
            ImprovementTaskSchema(
                id=str(t.id),
                competency_id=t.competency_id,
                title=t.title,
                description=t.description,
                observed_weakness=t.observed_weakness,
                estimated_time=t.estimated_time,
                priority=t.priority,
                completed=t.completed,
                success_criteria=t.success_criteria,
            )
            for t in tasks
        ],
    )
