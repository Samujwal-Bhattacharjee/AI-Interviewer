"""
app/services/adaptive_engine.py — Adaptive question selection engine.

The adaptive engine owns all assessment decisions:
  - Which competency to assess next
  - What difficulty to use
  - When to stop
  - How to update the search region

The frontend NEVER makes these decisions.

Algorithm: Binary-search-based adaptive testing (simplified IRT).
Phase 2K: Can be replaced with full IRT using Graphiti context.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.question import Question
from app.models.session import AssessmentSession

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
        Selects the next question based on the current adaptive state.

        Strategy:
        1. Pick the highest-priority competency in focus_competencies
        2. Select a question at the current difficulty that hasn't been asked
        3. Prefer questions from underexplored competencies
        """
        target_difficulty = session.adaptive_current_difficulty
        focus = session.focus_competencies or []
        attempted = session.attempted_question_ids or []

        # Try to find a question at target difficulty, in focus competencies, not yet attempted
        query = (
            select(Question)
            .options(selectinload(Question.competency))
            .where(
                Question.is_active == True,  # noqa: E712
                Question.id.not_in(attempted) if attempted else True,
            )
        )

        if focus:
            query = query.where(Question.competency_id.in_(focus))

        query = query.where(Question.difficulty == target_difficulty)

        result = await db.execute(query.limit(10))
        candidates = result.scalars().all()

        if candidates:
            # Simple selection: first available (Phase 2K: use IRT to rank)
            return candidates[0]

        # Fallback: try adjacent difficulties
        difficulty_idx = DIFFICULTY_ORDER.index(target_difficulty) if target_difficulty in DIFFICULTY_ORDER else 2
        for offset in [1, -1, 2, -2]:
            adj_idx = difficulty_idx + offset
            if 0 <= adj_idx < len(DIFFICULTY_ORDER):
                adj_difficulty = DIFFICULTY_ORDER[adj_idx]
                fallback_query = (
                    select(Question)
                    .options(selectinload(Question.competency))
                    .where(
                        Question.is_active == True,  # noqa: E712
                        Question.difficulty == adj_difficulty,
                        Question.id.not_in(attempted) if attempted else True,
                    )
                )
                if focus:
                    fallback_query = fallback_query.where(Question.competency_id.in_(focus))

                result = await db.execute(fallback_query.limit(5))
                fallback = result.scalars().all()
                if fallback:
                    return fallback[0]

        # Fallback 2: relax focus competencies to any active question not yet attempted
        relaxed_query = (
            select(Question)
            .options(selectinload(Question.competency))
            .where(
                Question.is_active == True,  # noqa: E712
                Question.id.not_in(attempted) if attempted else True,
            )
        )
        result = await db.execute(relaxed_query.limit(5))
        relaxed = result.scalars().all()
        if relaxed:
            return relaxed[0]

        # Fallback 3: if all questions have been attempted, return any active question
        any_query = (
            select(Question)
            .options(selectinload(Question.competency))
            .where(Question.is_active == True)  # noqa: E712
        )
        result = await db.execute(any_query.limit(1))
        any_q = result.scalars().all()
        if any_q:
            return any_q[0]

        return None

    @staticmethod
    def update_state(session: AssessmentSession, correctness: float) -> None:
        """
        Updates the session's adaptive state based on answer correctness.

        Correctness >= 0.7: increase difficulty (move search region up)
        Correctness <= 0.4: decrease difficulty (move search region down)
        Otherwise: probe at current level (gather more evidence)
        """
        difficulty_idx = DIFFICULTY_ORDER.index(session.adaptive_current_difficulty) \
            if session.adaptive_current_difficulty in DIFFICULTY_ORDER else 2

        if correctness >= 0.7:
            # Good answer — increase difficulty
            new_idx = min(difficulty_idx + 1, len(DIFFICULTY_ORDER) - 1)
            session.adaptive_current_difficulty = DIFFICULTY_ORDER[new_idx]
            session.adaptive_last_action = "increase"
            # Update search region: lower bound moves up
            session.adaptive_search_lower = session.adaptive_current_difficulty
        elif correctness <= 0.4:
            # Poor answer — decrease difficulty
            new_idx = max(difficulty_idx - 1, 0)
            session.adaptive_current_difficulty = DIFFICULTY_ORDER[new_idx]
            session.adaptive_last_action = "decrease"
            # Update search region: upper bound moves down
            session.adaptive_search_upper = session.adaptive_current_difficulty
        else:
            # Ambiguous — probe at same level, gather more evidence
            session.adaptive_last_action = "probe"

        # Update current estimate (simple proxy — Phase 2K: real IRT)
        session.adaptive_current_estimate = DIFFICULTY_SCORES.get(
            session.adaptive_current_difficulty, 50
        )
        session.adaptive_evidence_analyzed = True
