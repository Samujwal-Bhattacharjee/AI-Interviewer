"""
app/services/adaptive_engine.py — Adaptive question selection engine.

The adaptive engine owns all assessment decisions:
  - Which competency to assess next (balanced coverage across focus competencies)
  - What difficulty to use (binary-search based on answer correctness)
  - Dynamic question generation via LLMService (with database fallback)
  - Search region and estimate updates

The frontend NEVER makes these decisions.
"""
import logging
import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.question import Question
from app.models.session import AssessmentSession
from app.models.role import Competency, Role, RoleCompetency
from app.models.answer import QuestionAttempt
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

# Difficulty ordering (numeric mapping for comparison)
DIFFICULTY_ORDER = ["foundational", "easy", "medium", "hard", "expert"]
DIFFICULTY_SCORES = {d: i * 25 for i, d in enumerate(DIFFICULTY_ORDER)}


class AdaptiveEngine:
    @staticmethod
    async def select_next_question(
        session: AssessmentSession,
        db: AsyncSession,
    ) -> Question | None:
        """
        Selects or generates the next question based on current adaptive state.
        
        If a question was already selected/generated for this turn and not yet attempted,
        it returns that question.
        Otherwise, determines the next competency to test, selects target difficulty,
        and uses LLMService (if available) to generate a customized question.
        Falls back to the pre-seeded question database if LLM is unavailable.
        """
        attempted = session.attempted_question_ids or []

        # 1. If an active question exists and hasn't been answered, return it
        if session.current_question_id and session.current_question_id not in attempted:
            res = await db.execute(
                select(Question)
                .options(selectinload(Question.competency))
                .where(Question.id == session.current_question_id)
            )
            existing_q = res.scalar_one_or_none()
            if existing_q:
                return existing_q

        target_difficulty = session.adaptive_current_difficulty or "medium"

        # 2. Determine target role and candidate level
        role_res = await db.execute(
            select(Role)
            .where(Role.id == session.target_role_id)
            .options(selectinload(Role.requirements).selectinload(RoleCompetency.competency))
        )
        role = role_res.scalar_one_or_none()
        role_title = role.title if role else "Software Engineer"
        role_level = role.level if role else "junior"

        # 3. Determine available competencies for this session
        focus_ids = session.focus_competencies or []
        if not focus_ids and role:
            focus_ids = [req.competency_id for req in role.requirements if req.competency]

        # 4. Count questions previously asked per competency to ensure balanced rotation
        attempt_counts: dict[str, int] = {cid: 0 for cid in focus_ids}
        previous_questions_text: list[str] = []
        previous_attempts_summary: list[str] = []

        if attempted:
            att_res = await db.execute(
                select(QuestionAttempt)
                .where(QuestionAttempt.session_id == session.id)
                .options(selectinload(QuestionAttempt.question))
                .order_by(QuestionAttempt.created_at)
            )
            past_attempts = att_res.scalars().all()
            for pa in past_attempts:
                if pa.question:
                    cid = pa.question.competency_id
                    attempt_counts[cid] = attempt_counts.get(cid, 0) + 1
                    previous_questions_text.append(pa.question.question)
                    status_desc = "Demonstrated" if pa.correctness >= 0.7 else "Partial" if pa.correctness >= 0.35 else "Missing"
                    previous_attempts_summary.append(
                        f"Q: '{pa.question.question[:60]}...' -> {status_desc} ({int(pa.correctness * 100)}%)"
                    )

        # Pick the competency with the lowest number of attempts
        if focus_ids:
            selected_comp_id = min(focus_ids, key=lambda cid: attempt_counts.get(cid, 0))
        else:
            selected_comp_id = "comp-dsa"

        # Load competency details
        comp_res = await db.execute(select(Competency).where(Competency.id == selected_comp_id))
        selected_comp = comp_res.scalar_one_or_none()
        comp_name = selected_comp.name if selected_comp else selected_comp_id

        # 5. If LLM is available, generate a dynamic question tailored to state
        if llm_service.is_available():
            try:
                question_number = session.current_question_index + 1
                llm_output = await llm_service.generate_question(
                    role_title=role_title,
                    role_level=role_level,
                    competency_name=comp_name,
                    competency_id=selected_comp_id,
                    difficulty=target_difficulty,
                    question_number=question_number,
                    total_questions=session.question_count,
                    previous_questions=previous_questions_text,
                    previous_attempts_summary=previous_attempts_summary[-3:],
                )

                new_q_id = f"q-llm-{uuid.uuid4().hex[:8]}"
                generated_q = Question(
                    id=new_q_id,
                    competency_id=selected_comp_id,
                    difficulty=target_difficulty,
                    question_type=llm_output.question_type,
                    question=llm_output.question,
                    expected_concepts=llm_output.expected_concepts,
                    follow_up_prompts=llm_output.follow_up_prompts,
                    is_active=True,
                )
                db.add(generated_q)
                session.current_question_id = new_q_id
                await db.flush()
                await db.refresh(generated_q)
                generated_q.competency = selected_comp
                logger.info(f"LLM generated question {new_q_id} for {comp_name} ({target_difficulty})")
                return generated_q
            except Exception as e:
                logger.warning(f"Dynamic question generation via LLM failed, using DB question bank: {e}")

        # 6. Database Question Bank Fallback
        # Strategy A: Target difficulty, selected competency, not attempted
        query = (
            select(Question)
            .options(selectinload(Question.competency))
            .where(
                Question.is_active == True,  # noqa: E712
                Question.competency_id == selected_comp_id,
                Question.difficulty == target_difficulty,
                Question.id.not_in(attempted) if attempted else True,
            )
        )
        res = await db.execute(query.limit(5))
        candidates = res.scalars().all()
        if candidates:
            chosen = candidates[0]
            session.current_question_id = chosen.id
            return chosen

        # Strategy B: Any unattempted question in focus competencies at target difficulty
        if focus_ids:
            res = await db.execute(
                select(Question)
                .options(selectinload(Question.competency))
                .where(
                    Question.is_active == True,  # noqa: E712
                    Question.competency_id.in_(focus_ids),
                    Question.difficulty == target_difficulty,
                    Question.id.not_in(attempted) if attempted else True,
                ).limit(5)
            )
            candidates = res.scalars().all()
            if candidates:
                chosen = candidates[0]
                session.current_question_id = chosen.id
                return chosen

        # Strategy C: Adjacent difficulties in focus competencies
        diff_idx = DIFFICULTY_ORDER.index(target_difficulty) if target_difficulty in DIFFICULTY_ORDER else 2
        for offset in [1, -1, 2, -2]:
            adj_idx = diff_idx + offset
            if 0 <= adj_idx < len(DIFFICULTY_ORDER):
                adj_diff = DIFFICULTY_ORDER[adj_idx]
                fallback_query = (
                    select(Question)
                    .options(selectinload(Question.competency))
                    .where(
                        Question.is_active == True,  # noqa: E712
                        Question.difficulty == adj_diff,
                        Question.id.not_in(attempted) if attempted else True,
                    )
                )
                if focus_ids:
                    fallback_query = fallback_query.where(Question.competency_id.in_(focus_ids))
                res = await db.execute(fallback_query.limit(5))
                candidates = res.scalars().all()
                if candidates:
                    chosen = candidates[0]
                    session.current_question_id = chosen.id
                    return chosen

        # Strategy D: Any unattempted question
        relaxed_query = (
            select(Question)
            .options(selectinload(Question.competency))
            .where(
                Question.is_active == True,  # noqa: E712
                Question.id.not_in(attempted) if attempted else True,
            ).limit(5)
        )
        res = await db.execute(relaxed_query)
        candidates = res.scalars().all()
        if candidates:
            chosen = candidates[0]
            session.current_question_id = chosen.id
            return chosen

        # Strategy E: Reuse any active question if bank exhausted
        res = await db.execute(
            select(Question)
            .options(selectinload(Question.competency))
            .where(Question.is_active == True)  # noqa: E712
            .limit(1)
        )
        any_q = res.scalars().all()
        if any_q:
            chosen = any_q[0]
            session.current_question_id = chosen.id
            return chosen

        return None

    @staticmethod
    def update_state(session: AssessmentSession, correctness: float) -> None:
        """
        Updates the session's adaptive difficulty based on candidate correctness.
        Correctness >= 0.70 -> increase difficulty
        Correctness <= 0.40 -> decrease difficulty
        Otherwise           -> probe at current level
        """
        diff_idx = (
            DIFFICULTY_ORDER.index(session.adaptive_current_difficulty)
            if session.adaptive_current_difficulty in DIFFICULTY_ORDER
            else 2
        )

        if correctness >= 0.7:
            new_idx = min(diff_idx + 1, len(DIFFICULTY_ORDER) - 1)
            session.adaptive_current_difficulty = DIFFICULTY_ORDER[new_idx]
            session.adaptive_last_action = "increase"
            session.adaptive_search_lower = session.adaptive_current_difficulty
        elif correctness <= 0.4:
            new_idx = max(diff_idx - 1, 0)
            session.adaptive_current_difficulty = DIFFICULTY_ORDER[new_idx]
            session.adaptive_last_action = "decrease"
            session.adaptive_search_upper = session.adaptive_current_difficulty
        else:
            session.adaptive_last_action = "probe"

        session.adaptive_current_estimate = DIFFICULTY_SCORES.get(
            session.adaptive_current_difficulty, 50
        )
        session.adaptive_evidence_analyzed = True
