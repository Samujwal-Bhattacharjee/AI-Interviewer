"""
app/services/answer_evaluator.py — LLM-based answer evaluation service.

Evaluates a candidate's transcript against expected concepts for a question.
Returns structured evaluation:
  - correctness (0.0 - 1.0)
  - assessment ("demonstrated" | "partial" | "missing")
  - confidence (0.0 - 1.0)
  - concepts_demonstrated (list[str])
  - concepts_missing (list[str])
  - evidence items (detailed per-concept coverage)
"""
import logging
from dataclasses import dataclass
from typing import Optional

from app.services.llm_service import llm_service

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
    Uses LLMService when configured, with keyword semantic fallback.
    """

    async def evaluate(
        self,
        transcript: str,
        expected_concepts: list[str],
        competency_id: str,
        context: Optional[str] = None,
        question: Optional[str] = None,
        competency_name: Optional[str] = None,
        role_title: Optional[str] = None,
        role_level: Optional[str] = None,
        difficulty: Optional[str] = None,
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

        # 1. Try LLM evaluation if service is available
        if llm_service.is_available():
            try:
                llm_eval = await llm_service.evaluate_answer(
                    question=question or "Interview question",
                    expected_concepts=expected_concepts,
                    competency_name=competency_name or competency_id,
                    competency_id=competency_id,
                    transcript=cleaned_transcript,
                    role_title=role_title or "Software Engineer",
                    role_level=role_level or "junior",
                    difficulty=difficulty or "medium",
                )
                evidence = [
                    EvidenceItem(
                        concept=ev.concept,
                        status=ev.status,
                        explanation=ev.explanation,
                        confidence=ev.confidence,
                    )
                    for ev in llm_eval.evidence
                ]
                return EvaluationResult(
                    correctness=llm_eval.correctness,
                    assessment=llm_eval.assessment,
                    confidence=llm_eval.confidence,
                    concepts_demonstrated=llm_eval.concepts_demonstrated,
                    concepts_missing=llm_eval.concepts_missing,
                    evidence=evidence,
                )
            except Exception as e:
                logger.warning(f"LLM evaluation failed, falling back to semantic matcher: {e}")

        # 2. Semantic evaluation fallback
        return self._evaluate_semantic(cleaned_transcript, expected_concepts, competency_id)

    def _evaluate_semantic(
        self,
        transcript: str,
        expected_concepts: list[str],
        competency_id: str,
    ) -> EvaluationResult:
        """
        Keyword-expansion semantic fallback.
        Used when no LLM key is configured or call fails.
        """
        transcript_lower = transcript.lower()
        evidence: list[EvidenceItem] = []
        demonstrated_count = 0.0
        concepts_demonstrated: list[str] = []
        concepts_missing: list[str] = []

        # Synonym and concept keyword expansions
        expansions = {
            "hashing": ["hash", "index", "bucket", "key", "mapping"],
            "bucket mapping": ["bucket", "array", "index", "slot", "table"],
            "hash function": ["hash", "index", "bucket", "key", "mapping"],
            "collision handling": ["collision", "chain", "chaining", "probe", "probing", "open addressing", "linked list"],
            "average complexity": ["o(1)", "constant", "average", "time complexity", "speed"],
            "worst-case complexity": ["o(n)", "worst case", "all collide", "single bucket", "degrade"],
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
            "gil definition": ["gil", "global interpreter lock", "mutex", "cpython"],
            "thread safety": ["thread safe", "thread safety", "data race", "synchronization"],
            "cpu-bound limitation": ["cpu", "cpu bound", "single core", "parallel execution"],
            "multiprocessing": ["multiprocessing", "processes", "separate memory", "subprocesses"],
            "async io": ["async", "asyncio", "event loop", "await", "coroutines"],
            "decorators": ["decorator", "higher-order", "wraps", "closure", "wrapper", "function"],
            "debugging": ["isolate", "reproduce", "binary search", "log", "trace", "profiler"],
            "cache locality": ["cache", "locality", "contiguous", "cpu cache", "l1", "sequential"],
            "system design": ["scalable", "load balancer", "microservice", "database", "cache", "queue"],
            "api design": ["rest", "endpoint", "request", "response", "http", "json", "status code"],
            "concurrency": ["thread", "async", "lock", "race condition", "synchronize", "parallel"],
            "race conditions": ["race condition", "shared state", "concurrency", "threads", "race", "timing"],
            "shared state": ["shared state", "shared memory", "global variable", "shared resource"],
            "locking mechanisms": ["lock", "mutex", "semaphore", "rwlock", "spinlock", "atomic"],
            "memory management": ["heap", "stack", "allocation", "deallocation", "pointer", "memory"],
            "data structures": ["array", "list", "tree", "graph", "hash", "queue", "stack"],
            "algorithms": ["sort", "search", "recursion", "dynamic programming", "greedy", "complexity"],
            "dfs traversal order": ["depth first", "dfs", "deepest", "branch", "backtrack"],
            "bfs traversal order": ["breadth first", "bfs", "level", "queue", "layer"],
            "stack vs queue": ["stack", "queue", "fifo", "lifo", "recursion"],
            "shortest path": ["shortest path", "fewest edges", "unweighted", "distance"],
            "reproduce the issue": ["reproduce", "reproduction", "steps", "replicate", "reliable"],
            "isolate the condition": ["isolate", "narrow down", "environment", "test case"],
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
