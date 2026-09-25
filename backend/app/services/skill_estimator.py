"""
app/services/skill_estimator.py — Skill estimate update service.

After each answer, updates the user's skill estimate for the relevant competency.
Also creates a SkillHistory record for temporal tracking.

The adaptive engine owns this computation.
Frontend NEVER computes or decides skill scores.

Phase 2K: Replace simple scoring with IRT model.
Graphiti Phase 2K: Write skill change as temporal relationship.
"""
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill import SkillEstimate, SkillHistory

logger = logging.getLogger(__name__)

# Evidence weights: demonstrated = full weight, partial = half, missing = penalty
EVIDENCE_WEIGHTS = {"demonstrated": 1.0, "partial": 0.5, "missing": -0.1}

# Level thresholds (score -> estimated_level)
LEVEL_THRESHOLDS = [
    (0, "novice"),
    (20, "foundational"),
    (40, "developing"),
    (60, "proficient"),
    (80, "advanced"),
    (90, "expert"),
]


class SkillEstimator:
    """
    Updates skill estimates based on answer correctness and evidence quality.

    Phase 2K will use:
    - Bayesian IRT parameter estimation
    - Graphiti temporal context for prior estimates
    - Cross-session evidence aggregation
    """

    async def update_estimate(
        self,
        user_id: str,
        competency_id: str,
        correctness: float,
        evidence: list,
        session_id: str,
        db: AsyncSession,
    ) -> SkillEstimate:
        """
        Update (or create) the skill estimate for a user/competency pair.
        Returns the updated estimate.
        """
        # Get existing estimate or create new
        result = await db.execute(
            select(SkillEstimate).where(
                SkillEstimate.user_id == user_id,
                SkillEstimate.competency_id == competency_id,
            )
        )
        estimate = result.scalar_one_or_none()

        if estimate is None:
            estimate = SkillEstimate(
                user_id=user_id,
                competency_id=competency_id,
                score=50,
                confidence=0.0,
                confidence_level="low",
                evidence_count=0,
                estimated_level="novice",
                trend="stable",
            )
            db.add(estimate)
            await db.flush()

        old_score = estimate.score

        # Compute evidence quality score
        if evidence:
            evidence_score = sum(
                EVIDENCE_WEIGHTS.get(ev.status, 0) for ev in evidence
            ) / len(evidence)
        else:
            evidence_score = correctness - 0.5  # normalize around 0

        # Update score with exponential moving average
        # Weight: newer evidence has more influence, but don't jump too fast
        learning_rate = max(0.1, 1.0 / (estimate.evidence_count + 1))
        score_delta = evidence_score * 30 * learning_rate  # scale to 0-100 range
        new_score = int(max(0, min(100, estimate.score + score_delta)))

        # Update confidence (increases with evidence count)
        new_evidence_count = estimate.evidence_count + len(evidence) if evidence else estimate.evidence_count + 1
        new_confidence = min(0.95, 0.3 + (new_evidence_count * 0.07))
        confidence_level = (
            "high" if new_confidence >= 0.7 else "medium" if new_confidence >= 0.5 else "low"
        )

        # Update trend
        if new_score > old_score + 2:
            trend = "up"
        elif new_score < old_score - 2:
            trend = "down"
        else:
            trend = "stable"

        # Update estimated level
        estimated_level = _score_to_level(new_score)

        # Apply updates
        estimate.score = new_score
        estimate.confidence = round(new_confidence, 3)
        estimate.confidence_level = confidence_level
        estimate.evidence_count = new_evidence_count
        estimate.estimated_level = estimated_level
        estimate.trend = trend

        await db.flush()

        # Create history snapshot
        history_entry = SkillHistory(
            estimate_id=estimate.id,
            session_id=session_id,
            score=new_score,
            confidence=new_confidence,
            evidence_count=new_evidence_count,
            timestamp=datetime.utcnow(),
        )
        db.add(history_entry)
        await db.flush()

        logger.info(
            f"Updated skill estimate: user={user_id} comp={competency_id} "
            f"score={old_score}->{new_score} confidence={new_confidence:.2f}"
        )

        await db.refresh(estimate)
        return estimate


def _score_to_level(score: int) -> str:
    """Map numeric score to estimated level string."""
    level = "novice"
    for threshold, name in LEVEL_THRESHOLDS:
        if score >= threshold:
            level = name
    return level
