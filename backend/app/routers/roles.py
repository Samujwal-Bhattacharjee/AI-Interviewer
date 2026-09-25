"""
app/routers/roles.py — Role and competency endpoints.

GET /api/roles
GET /api/roles/{role_id}
GET /api/roles/{role_id}/blueprint
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.role import Competency, Role, RoleCompetency
from app.schemas.role import CompetencyAreaSchema, RoleBlueprintSchema, TargetRoleSchema

router = APIRouter(prefix="/api/roles", tags=["roles"])


@router.get("", response_model=list[TargetRoleSchema])
async def get_roles(db: AsyncSession = Depends(get_db)) -> list[TargetRoleSchema]:
    """Returns all available target roles with their competency models."""
    result = await db.execute(
        select(Role).options(
            selectinload(Role.requirements).selectinload(RoleCompetency.competency)
        )
    )
    roles = result.scalars().all()
    return [_role_to_schema(role) for role in roles]


@router.get("/{role_id}", response_model=TargetRoleSchema)
async def get_role(role_id: str, db: AsyncSession = Depends(get_db)) -> TargetRoleSchema:
    """Returns a single role with full competency model."""
    result = await db.execute(
        select(Role)
        .where(Role.id == role_id)
        .options(selectinload(Role.requirements).selectinload(RoleCompetency.competency))
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return _role_to_schema(role)


@router.get("/{role_id}/blueprint", response_model=RoleBlueprintSchema)
async def get_blueprint(role_id: str, db: AsyncSession = Depends(get_db)) -> RoleBlueprintSchema:
    """Returns the assessment blueprint for a role."""
    result = await db.execute(
        select(Role)
        .where(Role.id == role_id)
        .options(selectinload(Role.requirements).selectinload(RoleCompetency.competency))
    )
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    competency_areas = [
        CompetencyAreaSchema(
            competency_id=req.competency_id,
            concepts=req.competency.subskills if req.competency else [],
            question_areas=req.competency.subskills[:3] if req.competency else [],
            difficulty_range={"min": 30, "max": 85},
        )
        for req in role.requirements
    ]

    return RoleBlueprintSchema(
        role_id=role_id,
        competency_areas=competency_areas,
        estimated_questions=10,
        focus_areas=[req.competency.name for req in role.requirements[:3] if req.competency],
    )


def _role_to_schema(role: Role) -> TargetRoleSchema:
    """Convert ORM Role to Pydantic schema."""
    from app.schemas.role import CompetencyRequirementSchema, CompetencySchema

    return TargetRoleSchema(
        id=role.id,
        title=role.title,
        level=role.level,
        description=role.description,
        technologies=role.technologies,
        responsibilities=role.responsibilities,
        requirements=[
            CompetencyRequirementSchema(
                competency_id=req.competency_id,
                target_level=req.target_level,
                importance=req.importance,
            )
            for req in role.requirements
        ],
        competencies=[
            CompetencySchema(
                id=req.competency.id,
                name=req.competency.name,
                category=req.competency.category,
                description=req.competency.description,
                subskills=req.competency.subskills,
            )
            for req in role.requirements
            if req.competency
        ],
    )
