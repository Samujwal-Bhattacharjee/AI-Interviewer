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
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.session import AssessmentSession
from app.models.answer import QuestionAttempt, AnswerEvidence
from app.models.question import Question
from app.models.skill import SkillEstimate, SkillHistory
from app.models.role import RoleCompetency
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
    if session.status != "pending":
        raise HTTPException(status_code=409, detail="Session already started")

    session.status = "active"
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
    Selects the next adaptive question.
    The backend owns all selection logic — frontend never decides.
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
    Submit a candidate answer.

    Backend pipeline:
    1. Store answer
    2. Evaluate answer (LLM)
    3. Extract evidence
    4. Update skill estimate
    5. Update confidence
    6. Determine next difficulty
    7. Update adaptive state
    8. Return updated state
    (Graphiti write happens async — Phase 2K)
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

    # Evaluate answer
    evaluator = AnswerEvaluator()
    evaluation = await evaluator.evaluate(
        transcript=body.transcript,
        expected_concepts=question.expected_concepts,
        competency_id=question.competency_id,
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
    evidence_models = []
    for ev in evaluation.evidence:
        evidence_model = AnswerEvidence(
            attempt_id=attempt.id,
            concept=ev.concept,
            status=ev.status,
            explanation=ev.explanation,
            confidence=ev.confidence,
        )
        db.add(evidence_model)
        evidence_models.append(evidence_model)

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

    # Advance question index
    session.current_question_index += 1
    session.attempted_question_ids = [*session.attempted_question_ids, body.question_id]

    # Complete if done
    if session.current_question_index >= session.question_count:
        session.status = "completed"
        from datetime import datetime
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

    return AssessmentReportSchema(
        session_id=session_id,
        completed_at=session.completed_at or session.started_at,
        target_role_id=session.target_role_id,
        overall_score=overall_score,
        summary=_generate_summary(gaps, estimates),
        skill_estimates=[SkillEstimateSchema.model_validate(e) for e in estimates],
        gaps=gaps,
        evidence=evidence_items,
        recommendations=_generate_recommendations(gaps),
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
    """Basic summary — Phase 2K will use LLM + Graphiti context."""
    if not gaps:
        return "Assessment complete. Skill profile updated."
    critical = [g for g in gaps if g.priority == "critical"]
    if critical:
        names = ", ".join(g.competency_name for g in critical)
        return f"Assessment complete. Critical gaps identified in: {names}."
    return "Assessment complete. Review gap analysis for improvement areas."


def _generate_recommendations(gaps) -> list[str]:
    """Basic recommendations — Phase 2K will use LLM + Graphiti context."""
    recs = []
    for gap in gaps:
        if gap.gap < 0:
            recs.append(
                f"Practice {gap.competency_name} to close the {abs(gap.gap)}-point gap "
                f"toward the {gap.target_score} target."
            )
    return recs[:5]
