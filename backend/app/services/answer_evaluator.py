"""
app/services/answer_evaluator.py — LLM-based answer evaluation service.

Provider hierarchy:
1. Groq (llama-3.3-70b-versatile) — primary, structured JSON response
2. Semantic keyword matcher — fallback when Groq key absent or call fails

Evaluates a candidate's transcript against expected concepts for a question.
Returns structured evaluation:
  - correctness (0.0 - 1.0)
  - assessment ("demonstrated" | "partial" | "missing")
  - confidence (0.0 - 1.0)
  - concepts_demonstrated (list[str])
  - concepts_missing (list[str])
  - evidence items (detailed per-concept coverage)
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
    Uses Groq (llama-3.3-70b-versatile) when GROQ_API_KEY is configured.
    Falls back to a semantic keyword matching engine.

    Provider-agnostic contract:
      - Only the .evaluate() public method is called externally.
      - The LLM provider can be swapped by replacing _evaluate_with_llm().
    """

    async def evaluate(
        self,
        transcript: str,
        expected_concepts: list[str],
        competency_id: str,
        context: Optional[str] = None,
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

        # 1. Try Groq LLM evaluation
        if settings.groq_api_key:
            try:
                llm_result = await self._evaluate_with_groq(
                    cleaned_transcript, expected_concepts, competency_id, context
                )
                if llm_result:
                    return llm_result
            except Exception as e:
                logger.warning(f"Groq evaluation failed, falling back to semantic matcher: {e}")

        # 2. Semantic evaluation fallback
        return self._evaluate_semantic(cleaned_transcript, expected_concepts, competency_id)

    async def _evaluate_with_groq(
        self,
        transcript: str,
        expected_concepts: list[str],
        competency_id: str,
        context: Optional[str] = None,
    ) -> Optional[EvaluationResult]:
        """
        Calls Groq's OpenAI-compatible chat completions endpoint.
        Uses llama-3.3-70b-versatile which reliably returns valid JSON.
        Sends only the minimal context needed for evaluation.
        """
        context_block = f"\nRELEVANT PRIOR CONTEXT:\n{context}" if context else ""

        prompt = f"""You are an expert technical interviewer evaluating a candidate's spoken answer.

COMPETENCY: {competency_id}

EXPECTED CONCEPTS:
{json.dumps(expected_concepts)}

CANDIDATE ANSWER:
\"\"\"{transcript}\"\"\"{context_block}

For each expected concept, decide:
- "demonstrated": clearly explained, correctly applied, or sound reasoning shown
- "partial": mentioned or hinted at but lacking depth
- "missing": not addressed, incorrect, or contradicted

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{{
  "correctness": <float 0.0-1.0>,
  "confidence": <float 0.6-0.98>,
  "evidence": [
    {{
      "concept": "<exact concept name from expected list>",
      "status": "demonstrated" | "partial" | "missing",
      "explanation": "<one sentence rationale>",
      "confidence": <float 0.6-0.98>
    }}
  ]
}}"""

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.groq_model or "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                    "max_tokens": 1024,
                    "response_format": {"type": "json_object"},
                },
            )

        if resp.status_code != 200:
            logger.error(f"Groq API error {resp.status_code}: {resp.text[:200]}")
            return None

        data = resp.json()
        content = data["choices"][0]["message"]["content"]

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Groq returned invalid JSON: {e} — content: {content[:200]}")
            return None

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
            if status in ("demonstrated", "partial"):
                demonstrated.append(c_name)
            if status == "missing":
                missing.append(c_name)

        correctness = float(parsed.get("correctness", 0.5))
        overall_assessment = (
            "demonstrated" if correctness >= 0.7 else "partial" if correctness >= 0.35 else "missing"
        )

        logger.info(
            f"Groq evaluated {competency_id}: correctness={correctness:.2f}, "
            f"assessment={overall_assessment}, demonstrated={len(demonstrated)}, missing={len(missing)}"
        )

        return EvaluationResult(
            correctness=correctness,
            assessment=overall_assessment,
            confidence=float(parsed.get("confidence", 0.88)),
            concepts_demonstrated=demonstrated,
            concepts_missing=missing,
            evidence=evidence_items,
        )

    def _evaluate_semantic(
        self,
        transcript: str,
        expected_concepts: list[str],
        competency_id: str,
    ) -> EvaluationResult:
        """
        Keyword-expansion semantic fallback.
        Used when no Groq key is available or Groq call fails.
        """
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
            "system design": ["scalable", "load balancer", "microservice", "database", "cache", "queue"],
            "api design": ["rest", "endpoint", "request", "response", "http", "json", "status code"],
            "concurrency": ["thread", "async", "lock", "race condition", "synchronize", "parallel"],
            "memory management": ["heap", "stack", "allocation", "deallocation", "pointer", "memory"],
            "data structures": ["array", "list", "tree", "graph", "hash", "queue", "stack"],
            "algorithms": ["sort", "search", "recursion", "dynamic programming", "greedy", "complexity"],
        }

        for concept in expected_concepts:
            concept_clean = concept.lower()
            keywords = expansions.get(concept_clean, [w for w in concept_clean.replace("-", " ").split() if len(w) > 2])

            match_count = sum(1 for kw in keywords if kw in transcript_lower)
            match_ratio = match_count / len(keywords) if keywords else 0

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
            f"Semantic evaluated {competency_id}: correctness={correctness:.2f}, "
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
