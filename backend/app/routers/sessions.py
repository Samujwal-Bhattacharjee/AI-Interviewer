"""
app/routers/sessions.py — Assessment session endpoints.

POST /api/sessions
GET  /api/sessions/{session_id}
POST /api/sessions/{session_id}/start
POST /api/sessions/{session_id}/next-question
POST /api/sessions/{session_id}/answers
GET  /api/sessions/{session_id}/current-state
GET  /api/sessions/{session_id}/report
"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.session import AssessmentSession
from app.models.answer import QuestionAttempt, AnswerEvidence
from app.models.question import Question
from app.models.skill import SkillEstimate, SkillHistory
from app.models.role import Role, RoleCompetency
from app.schemas.session import (
    AssessmentSessionSchema,
    CreateSessionRequest,
    SessionStateSchema,
    StartSessionResponse,
)
from app.schemas.answer import AdaptiveStateSchema, SkillEstimateSchema, SubmitAnswerRequest, SubmitAnswerResponse
from app.schemas.question import CompetencyRefSchema, NextQuestionResponse
from app.schemas.report import AssessmentReportSchema
from app.services.adaptive_engine import AdaptiveEngine
from app.services.answer_evaluator import AnswerEvaluator
from app.services.skill_estimator import SkillEstimator
from app.services.course_recommendation_service import course_recommendation_service
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=AssessmentSessionSchema, status_code=201)
async def create_session(
    body: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
) -> AssessmentSessionSchema:
    """Creates a new assessment session in 'pending' state."""
    question_count = {"quick": 5, "standard": 10, "deep": 20}.get(body.duration, 10)

    session = AssessmentSession(
        user_id=body.user_id,
        target_role_id=body.target_role_id,
        duration=body.duration,
        question_count=question_count,
        focus_competencies=body.focus_competencies,
        status="pending",
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return AssessmentSessionSchema.model_validate(session)


@router.get("/{session_id}", response_model=AssessmentSessionSchema)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)) -> AssessmentSessionSchema:
    """Returns current session state."""
    session = await _get_session_or_404(session_id, db)
    return AssessmentSessionSchema.model_validate(session)


@router.post("/{session_id}/start", response_model=StartSessionResponse)
async def start_session(session_id: str, db: AsyncSession = Depends(get_db)) -> StartSessionResponse:
    """Activates the session and returns the first question + adaptive state."""
    session = await _get_session_or_404(session_id, db)
    if session.status == "completed":
        raise HTTPException(status_code=409, detail="Session already complete")
    if session.status == "abandoned":
        raise HTTPException(status_code=409, detail="Session was abandoned")

    if session.status == "pending":
        session.status = "active"
        session.started_at = datetime.utcnow()
        await db.flush()

    first_question = await AdaptiveEngine.select_next_question(session, db)
    if not first_question:
        raise HTTPException(status_code=500, detail="No questions available for this session configuration")

    return StartSessionResponse(
        session=AssessmentSessionSchema.model_validate(session),
        first_question=_question_to_response(first_question, session),
        adaptive_state=_session_adaptive_state(session),
    )


@router.post("/{session_id}/next-question", response_model=NextQuestionResponse)
async def next_question(session_id: str, db: AsyncSession = Depends(get_db)) -> NextQuestionResponse:
    """
    Selects or dynamically generates the next adaptive question.
    The backend owns all selection and adaptation logic.
    """
    session = await _get_session_or_404(session_id, db)
    if session.status == "completed":
        raise HTTPException(status_code=409, detail="Session already complete")
    if session.status == "abandoned":
        raise HTTPException(status_code=409, detail="Session was abandoned")

    question = await AdaptiveEngine.select_next_question(session, db)
    if not question:
        raise HTTPException(status_code=404, detail="No suitable question found")

    return _question_to_response(question, session)


@router.post("/{session_id}/answers", response_model=SubmitAnswerResponse)
async def submit_answer(
    session_id: str,
    body: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db),
) -> SubmitAnswerResponse:
    """
    Submits a candidate answer.
    Pipeline:
    1. Fetch question and role context
    2. Evaluate answer via LLM (with semantic fallback)
    3. Persist QuestionAttempt and AnswerEvidence
    4. Update SkillEstimates in PostgreSQL
    5. Update AdaptiveEngine difficulty state
    6. Advance session turn counter (mark completed if finished)
    7. Return real updated state
    """
    session = await _get_session_or_404(session_id, db)
    if session.status != "active":
        raise HTTPException(status_code=409, detail="Session is not active")

    # Get question
    result = await db.execute(
        select(Question)
        .where(Question.id == body.question_id)
        .options(selectinload(Question.competency))
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Get role context
    role_res = await db.execute(select(Role).where(Role.id == session.target_role_id))
    role = role_res.scalar_one_or_none()

    comp_name = question.competency.name if question.competency else question.competency_id

    # Evaluate answer via evaluator
    evaluator = AnswerEvaluator()
    evaluation = await evaluator.evaluate(
        transcript=body.transcript,
        expected_concepts=question.expected_concepts,
        competency_id=question.competency_id,
        question=question.question,
        competency_name=comp_name,
        role_title=role.title if role else "Software Engineer",
        role_level=role.level if role else "junior",
        difficulty=session.adaptive_current_difficulty,
    )

    # Store attempt
    attempt = QuestionAttempt(
        session_id=session_id,
        question_id=body.question_id,
        transcript=body.transcript,
        answer_text=body.transcript,
        correctness=evaluation.correctness,
        duration_ms=body.duration_ms,
        difficulty_at_attempt=session.adaptive_current_difficulty,
    )
    db.add(attempt)
    await db.flush()
    await db.refresh(attempt)

    # Store evidence
    for ev in evaluation.evidence:
        evidence_model = AnswerEvidence(
            attempt_id=attempt.id,
            concept=ev.concept,
            status=ev.status,
            explanation=ev.explanation,
            confidence=ev.confidence,
        )
        db.add(evidence_model)

    # Update skill estimate
    skill_estimator = SkillEstimator()
    updated_estimate = await skill_estimator.update_estimate(
        user_id=session.user_id,
        competency_id=question.competency_id,
        correctness=evaluation.correctness,
        evidence=evaluation.evidence,
        session_id=session_id,
        db=db,
    )

    # Update adaptive state
    AdaptiveEngine.update_state(session, evaluation.correctness)

    # Advance question index & mark question attempted
    session.current_question_index += 1
    session.attempted_question_ids = [*session.attempted_question_ids, body.question_id]
    session.current_question_id = None  # Ready for next question

    # Complete if done
    if session.current_question_index >= session.question_count:
        session.status = "completed"
        session.completed_at = datetime.utcnow()

    await db.flush()

    return SubmitAnswerResponse(
        attempt_id=attempt.id,
        question_id=body.question_id,
        correctness=evaluation.correctness,
        assessment=evaluation.assessment,
        confidence=evaluation.confidence,
        concepts_demonstrated=evaluation.concepts_demonstrated,
        concepts_missing=evaluation.concepts_missing,
        evidence=[
            _evidence_to_schema(ev) for ev in evaluation.evidence
        ],
        updated_skill_estimates=[SkillEstimateSchema.model_validate(updated_estimate)],
        adaptive_state=_session_adaptive_state(session),
    )


@router.get("/{session_id}/current-state", response_model=SessionStateSchema)
async def get_current_state(session_id: str, db: AsyncSession = Depends(get_db)) -> SessionStateSchema:
    """Returns the current session state for reconnection/refresh."""
    session = await _get_session_or_404(session_id, db)

    # Get skill estimates for this user
    result = await db.execute(
        select(SkillEstimate).where(SkillEstimate.user_id == session.user_id)
    )
    estimates = result.scalars().all()

    return SessionStateSchema(
        session_id=session_id,
        status=session.status,
        current_question_index=session.current_question_index,
        total_questions=session.question_count,
        adaptive_state=_session_adaptive_state(session),
        skill_estimates=[SkillEstimateSchema.model_validate(e) for e in estimates],
    )


@router.get("/{session_id}/report", response_model=AssessmentReportSchema)
async def get_report(session_id: str, db: AsyncSession = Depends(get_db)) -> AssessmentReportSchema:
    """Returns the full assessment report for a completed session."""
    session = await _get_session_or_404(session_id, db)
    if session.status != "completed":
        raise HTTPException(status_code=409, detail="Session not yet complete")

    # Get skill estimates
    result = await db.execute(
        select(SkillEstimate).where(SkillEstimate.user_id == session.user_id)
    )
    estimates = result.scalars().all()

    # Get role requirements for gap analysis
    result = await db.execute(
        select(RoleCompetency)
        .where(RoleCompetency.role_id == session.target_role_id)
        .options(selectinload(RoleCompetency.competency))
    )
    requirements = result.scalars().all()

    # Get role object
    role_res = await db.execute(select(Role).where(Role.id == session.target_role_id))
    role = role_res.scalar_one_or_none()

    # Compute gaps
    from app.schemas.skill import GapAnalysisSchema
    gaps = []
    for req in requirements:
        est = next((e for e in estimates if e.competency_id == req.competency_id), None)
        if est and req.competency:
            gap = est.score - req.target_level
            priority = "critical" if gap < -20 else "high" if gap < -10 else "medium" if gap < 0 else "low"
            gaps.append(GapAnalysisSchema(
                competency_id=req.competency_id,
                competency_name=req.competency.name,
                current_score=est.score,
                target_score=req.target_level,
                gap=gap,
                priority=priority,
            ))

    # Get evidence from this session's attempts
    result = await db.execute(
        select(QuestionAttempt)
        .where(QuestionAttempt.session_id == session_id)
        .options(
            selectinload(QuestionAttempt.evidence),
            selectinload(QuestionAttempt.question),
        )
        .order_by(QuestionAttempt.created_at)
    )
    attempts = result.scalars().all()

    from app.schemas.report import ReportEvidenceSchema
    evidence_items = []
    for attempt in attempts:
        for ev in attempt.evidence:
            evidence_items.append(ReportEvidenceSchema(
                question_id=attempt.question_id,
                competency_id=attempt.question.competency_id if attempt.question else "",
                concept=ev.concept,
                status=ev.status,
                explanation=ev.explanation,
                confidence=ev.confidence,
            ))

    overall_score = int(sum(e.score for e in estimates) / len(estimates)) if estimates else 0

    # Generate course recommendations from gaps
    from app.schemas.report import ResourceRecommendationsSchema, CourseResourceSchema
    gap_dicts = [
        {
            "competency_id": g.competency_id,
            "competency_name": g.competency_name,
            "current_score": g.current_score,
            "target_score": g.target_score,
            "gap": g.gap,
            "priority": g.priority,
        }
        for g in gaps
    ]
    all_resources = course_recommendation_service.get_recommendations_for_gaps(gap_dicts, max_per_competency=2)
    free_resources = [CourseResourceSchema(**r) for r in all_resources if r["price_type"] == "free"]
    paid_resources = [CourseResourceSchema(**r) for r in all_resources if r["price_type"] == "paid"]
    resources = ResourceRecommendationsSchema(free=free_resources, paid=paid_resources, source="curated")

    # Generate summary & recommendations via LLM if available
    summary = None
    recommendations = None

    if llm_service.is_available():
        try:
            role_title = role.title if role else "Software Engineer"
            role_level = role.level if role else "junior"
            skill_est_dicts = [
                {
                    "competency_id": e.competency_id,
                    "score": e.score,
                    "level": e.estimated_level,
                    "confidence": e.confidence,
                }
                for e in estimates
            ]
            attempts_dicts = [
                {
                    "question": a.question.question if a.question else "",
                    "transcript": a.transcript,
                    "correctness": a.correctness,
                    "demonstrated": [ev.concept for ev in a.evidence if ev.status == "demonstrated"],
                    "missing": [ev.concept for ev in a.evidence if ev.status == "missing"],
                }
                for a in attempts
            ]
            llm_rep = await llm_service.generate_report(
                role_title=role_title,
                role_level=role_level,
                overall_score=overall_score,
                skill_estimates=skill_est_dicts,
                gaps=gap_dicts,
                attempts=attempts_dicts,
            )
            summary = llm_rep.summary
            recommendations = llm_rep.recommendations
        except Exception as e:
            logger.warning(f"LLM report generation error: {e}")

    if not summary:
        summary = _generate_summary(gaps, estimates)
    if not recommendations:
        recommendations = _generate_recommendations(gaps)

    return AssessmentReportSchema(
        session_id=session_id,
        completed_at=session.completed_at or session.started_at,
        target_role_id=session.target_role_id,
        overall_score=overall_score,
        summary=summary,
        skill_estimates=[SkillEstimateSchema.model_validate(e) for e in estimates],
        gaps=gaps,
        evidence=evidence_items,
        recommendations=recommendations,
        resources=resources,
    )


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _get_session_or_404(session_id: str, db: AsyncSession) -> AssessmentSession:
    result = await db.execute(select(AssessmentSession).where(AssessmentSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def _session_adaptive_state(session: AssessmentSession) -> AdaptiveStateSchema:
    return AdaptiveStateSchema(
        current_difficulty=session.adaptive_current_difficulty,
        search_region={
            "lower": session.adaptive_search_lower,
            "upper": session.adaptive_search_upper,
        },
        last_action=session.adaptive_last_action,
        evidence_analyzed=session.adaptive_evidence_analyzed,
        current_estimate=session.adaptive_current_estimate,
    )


def _question_to_response(question: Question, session: AssessmentSession) -> NextQuestionResponse:
    comp_name = question.competency.name if question.competency else question.competency_id
    return NextQuestionResponse(
        question_id=question.id,
        competency=CompetencyRefSchema(id=question.competency_id, name=comp_name),
        difficulty=question.difficulty,
        question_type=question.question_type,
        question=question.question,
        expected_concepts=question.expected_concepts,
        follow_up_prompts=question.follow_up_prompts,
        question_number=session.current_question_index + 1,
        total_questions=session.question_count,
    )


def _evidence_to_schema(ev) -> "AnswerEvidenceSchema":
    from app.schemas.answer import AnswerEvidenceSchema
    return AnswerEvidenceSchema(
        concept=ev.concept,
        status=ev.status,
        explanation=ev.explanation,
        confidence=ev.confidence,
    )


def _generate_summary(gaps, estimates) -> str:
    if not gaps:
        return "Assessment complete. Candidate demonstrated solid technical baseline across tested competencies."
    critical = [g for g in gaps if g.priority == "critical"]
    if critical:
        names = ", ".join(g.competency_name for g in critical)
        return f"Assessment complete. Candidate demonstrated fundamental technical comprehension, but critical development areas were identified in: {names}."
    return "Assessment complete. Performance met baseline expectations across primary competencies with targeted areas for growth."


def _generate_recommendations(gaps) -> list[str]:
    recs = []
    for gap in gaps:
        if gap.gap < 0:
            recs.append(
                f"Practice targeted {gap.competency_name} exercises to close the {abs(gap.gap)}-point gap "
                f"toward the target score of {gap.target_score}."
            )
    return recs[:5] if recs else ["Continue regular practice across core architectural and design patterns."]
