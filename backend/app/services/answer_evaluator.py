"""
app/services/answer_evaluator.py — LLM-based answer evaluation service.

Evaluates a candidate's transcript against the expected concepts for a question.
Returns:
  - correctness (0.0 - 1.0)
  - evidence items (concept coverage)

Phase 2K: Connect to OpenAI/Gemini API.
Current: Stub implementation that returns placeholder evaluations.
"""
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class EvidenceItem:
    concept: str
    status: str  # demonstrated | partial | missing
    explanation: str
    confidence: float


@dataclass
class EvaluationResult:
    correctness: float
    evidence: list[EvidenceItem]


class AnswerEvaluator:
    """
    Evaluates interview answers against expected concepts.

    Phase 2K implementation will:
    1. Build a prompt with question context and transcript
    2. Call LLM (OpenAI/Gemini) for evaluation
    3. Parse structured JSON response
    4. Write evidence to Graphiti

    Current: Stub that scores based on transcript length (demo only).
    """

    async def evaluate(
        self,
        transcript: str,
        expected_concepts: list[str],
        competency_id: str,
    ) -> EvaluationResult:
        """
        Evaluate a transcript against expected concepts.

        TODO Phase 2K: Replace stub with LLM evaluation.
        """
        if not transcript or len(transcript.strip()) < 20:
            # Too short — mark everything as missing
            evidence = [
                EvidenceItem(
                    concept=concept,
                    status="missing",
                    explanation="Answer too brief to evaluate",
                    confidence=0.9,
                )
                for concept in expected_concepts
            ]
            return EvaluationResult(correctness=0.0, evidence=evidence)

        # Stub: keyword matching (replace with LLM in Phase 2K)
        transcript_lower = transcript.lower()
        evidence = []
        demonstrated_count = 0

        for concept in expected_concepts:
            concept_words = concept.lower().replace("-", " ").split()
            matched_words = sum(1 for word in concept_words if word in transcript_lower)
            match_ratio = matched_words / len(concept_words) if concept_words else 0

            if match_ratio >= 0.7:
                status = "demonstrated"
                explanation = f"Key terms from '{concept}' found in answer"
                confidence = 0.75
                demonstrated_count += 1
            elif match_ratio >= 0.3:
                status = "partial"
                explanation = f"Partial coverage of '{concept}'"
                confidence = 0.65
                demonstrated_count += 0.5
            else:
                status = "missing"
                explanation = f"'{concept}' not clearly addressed"
                confidence = 0.80

            evidence.append(EvidenceItem(
                concept=concept,
                status=status,
                explanation=explanation,
                confidence=confidence,
            ))

        correctness = demonstrated_count / len(expected_concepts) if expected_concepts else 0.5
        correctness = min(max(correctness, 0.0), 1.0)

        logger.info(
            f"Evaluated answer for {competency_id}: correctness={correctness:.2f}, "
            f"concepts={len(expected_concepts)}"
        )

        return EvaluationResult(correctness=correctness, evidence=evidence)
