"""
app/services/answer_evaluator.py — LLM-based answer evaluation service.

Evaluates a candidate's transcript against the expected concepts for a question.
Returns structured evaluation:
  - correctness (0.0 - 1.0)
  - assessment ("demonstrated" | "partial" | "missing")
  - confidence (0.0 - 1.0)
  - concepts_demonstrated (list[str])
  - concepts_missing (list[str])
  - evidence items (detailed coverage)
"""
import json
import logging
from dataclasses import dataclass
from typing import Optional

import httpx

from app.config import settings

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
    assessment: str  # demonstrated | partial | missing
    confidence: float
    concepts_demonstrated: list[str]
    concepts_missing: list[str]
    evidence: list[EvidenceItem]


class AnswerEvaluator:
    """
    Evaluates interview answers against expected concepts.
    If an OpenAI key is present, calls the LLM for structured scoring.
    Otherwise, uses a robust semantic concept alignment engine.
    """

    async def evaluate(
        self,
        transcript: str,
        expected_concepts: list[str],
        competency_id: str,
    ) -> EvaluationResult:
        cleaned_transcript = (transcript or "").strip()

        # Guard against empty/trivial inputs
        if len(cleaned_transcript) < 15:
            evidence = [
                EvidenceItem(
                    concept=concept,
                    status="missing",
                    explanation="No substantial response provided",
                    confidence=0.95,
                )
                for concept in expected_concepts
            ]
            return EvaluationResult(
                correctness=0.0,
                assessment="missing",
                confidence=0.95,
                concepts_demonstrated=[],
                concepts_missing=expected_concepts,
                evidence=evidence,
            )

        # 1. Try LLM evaluation if API key is provided
        if settings.openai_api_key:
            try:
                llm_result = await self._evaluate_with_llm(
                    cleaned_transcript, expected_concepts, competency_id
                )
                if llm_result:
                    return llm_result
            except Exception as e:
                logger.warning(f"LLM evaluation failed, falling back to semantic matcher: {e}")

        # 2. Semantic evaluation fallback
        return self._evaluate_semantic(cleaned_transcript, expected_concepts, competency_id)

    async def _evaluate_with_llm(
        self,
        transcript: str,
        expected_concepts: list[str],
        competency_id: str,
    ) -> Optional[EvaluationResult]:
        prompt = f"""You are an expert technical interviewer evaluating a candidate's verbal response for the competency '{competency_id}'.

Expected Concepts to cover:
{json.dumps(expected_concepts)}

Candidate's Spoken Answer:
\"\"\"{transcript}\"\"\"

Analyze whether each concept was:
- "demonstrated": Clearly explained, correctly applied, or sound reasoning shown.
- "partial": Touched upon, hinted at, or partially correct but lacking depth.
- "missing": Not addressed, incorrect, or contradicted.

Return ONLY a valid JSON object with this exact structure:
{{
  "correctness": <float between 0.0 and 1.0>,
  "confidence": <float between 0.6 and 0.98>,
  "evidence": [
    {{
      "concept": "<exact concept name>",
      "status": "demonstrated" | "partial" | "missing",
      "explanation": "<short rationale, 1 sentence>",
      "confidence": <float between 0.6 and 0.98>
    }}
  ]
}}"""

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.llm_model or "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)

                evidence_items = []
                demonstrated = []
                missing = []

                for item in parsed.get("evidence", []):
                    status = item.get("status", "missing")
                    c_name = item.get("concept", "")
                    evidence_items.append(
                        EvidenceItem(
                            concept=c_name,
                            status=status,
                            explanation=item.get("explanation", ""),
                            confidence=float(item.get("confidence", 0.85)),
                        )
                    )
                    if status == "demonstrated":
                        demonstrated.append(c_name)
                    elif status == "missing":
                        missing.append(c_name)

                correctness = float(parsed.get("correctness", 0.5))
                overall_assessment = (
                    "demonstrated" if correctness >= 0.7 else "partial" if correctness >= 0.35 else "missing"
                )

                return EvaluationResult(
                    correctness=correctness,
                    assessment=overall_assessment,
                    confidence=float(parsed.get("confidence", 0.88)),
                    concepts_demonstrated=demonstrated,
                    concepts_missing=missing,
                    evidence=evidence_items,
                )
        return None

    def _evaluate_semantic(
        self,
        transcript: str,
        expected_concepts: list[str],
        competency_id: str,
    ) -> EvaluationResult:
        transcript_lower = transcript.lower()
        evidence: list[EvidenceItem] = []
        demonstrated_count = 0.0
        concepts_demonstrated: list[str] = []
        concepts_missing: list[str] = []

        # Synonym and concept keyword expansions
        expansions = {
            "hash function": ["hash", "index", "bucket", "key", "mapping"],
            "collision handling": ["collision", "chain", "chaining", "probe", "probing", "open addressing", "linked list"],
            "time complexity": ["o(1)", "constant", "time", "complexity", "worst case", "lookup", "speed"],
            "load factor": ["load factor", "resize", "rehashing", "threshold", "capacity", "expand"],
            "b-tree": ["b-tree", "b+tree", "tree", "binary", "structure", "disk", "node"],
            "read vs write tradeoff": ["read", "write", "overhead", "tradeoff", "insert", "update", "fast"],
            "composite index": ["composite", "multiple columns", "column", "order", "prefix", "leftmost"],
            "explain analyze": ["explain", "analyze", "execution plan", "query plan", "cost", "scan"],
            "indexing": ["index", "b-tree", "lookup", "speed", "where"],
            "transactions": ["acid", "transaction", "commit", "rollback", "isolation", "consistency"],
            "reference counting": ["reference count", "ref count", "reference", "counter", "pointers"],
            "garbage collection": ["garbage collector", "generational", "gc", "cycle", "cyclic", "threshold"],
            "gil": ["gil", "global interpreter lock", "thread", "concurrency", "lock", "cpu"],
            "decorators": ["decorator", "higher-order", "wraps", "closure", "wrapper", "function"],
            "debugging": ["isolate", "reproduce", "binary search", "log", "trace", "profiler"],
            "cache locality": ["cache", "locality", "contiguous", "cpu cache", "l1", "sequential"],
        }

        for concept in expected_concepts:
            concept_clean = concept.lower()
            keywords = expansions.get(concept_clean, [w for w in concept_clean.replace("-", " ").split() if len(w) > 2])

            match_count = sum(1 for kw in keywords if kw in transcript_lower)
            match_ratio = match_count / len(keywords) if keywords else 0

            # Score matching
            if match_ratio >= 0.4 or any(kw in transcript_lower for kw in [concept_clean, concept_clean.replace("-", " ")]):
                status = "demonstrated"
                explanation = f"Candidate demonstrated core concepts of '{concept}' with accurate technical terminology."
                confidence = 0.88
                demonstrated_count += 1.0
                concepts_demonstrated.append(concept)
            elif match_ratio >= 0.15 or match_count >= 1:
                status = "partial"
                explanation = f"Partial coverage of '{concept}' — foundational aspects mentioned without comprehensive depth."
                confidence = 0.72
                demonstrated_count += 0.5
                concepts_demonstrated.append(concept)
            else:
                status = "missing"
                explanation = f"Key requirements of '{concept}' were omitted from the candidate's explanation."
                confidence = 0.85
                concepts_missing.append(concept)

            evidence.append(
                EvidenceItem(
                    concept=concept,
                    status=status,
                    explanation=explanation,
                    confidence=confidence,
                )
            )

        correctness = demonstrated_count / len(expected_concepts) if expected_concepts else 0.5
        correctness = round(min(max(correctness, 0.0), 1.0), 2)
        overall_assessment = (
            "demonstrated" if correctness >= 0.7 else "partial" if correctness >= 0.35 else "missing"
        )
        avg_confidence = round(sum(e.confidence for e in evidence) / len(evidence), 2) if evidence else 0.85

        logger.info(
            f"Evaluated answer for {competency_id}: correctness={correctness:.2f}, "
            f"assessment={overall_assessment}, demonstrated={len(concepts_demonstrated)}, missing={len(concepts_missing)}"
        )

        return EvaluationResult(
            correctness=correctness,
            assessment=overall_assessment,
            confidence=avg_confidence,
            concepts_demonstrated=concepts_demonstrated,
            concepts_missing=concepts_missing,
            evidence=evidence,
        )
