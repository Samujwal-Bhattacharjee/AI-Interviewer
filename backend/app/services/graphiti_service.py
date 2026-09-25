"""
app/services/graphiti_service.py — Service abstraction for Graphiti + Neo4j.

Graphiti represents the temporal and contextual knowledge graph layer for ADAPTIVE:
  - User -[ATTEMPTED]-> AssessmentSession
  - User -[HAS_TARGET]-> Role
  - User -[DEMONSTRATES]-> Concept (evidence from answers)
  - User -[STRUGGLES_WITH]-> Concept (weaknesses)
  - Competency -[SKILL_UPDATED]-> Score Transition

ARCHITECTURAL PRINCIPLES:
1. PostgreSQL is the structured application source of truth.
2. Graphiti + Neo4j provides temporal knowledge and contextual narrative.
3. Graphiti calls must NEVER crash the application or block PostgreSQL/API requests.
4. If Neo4j or credentials are not configured, this service operates in disconnected
   mode with zero disruption to core features.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.config import settings

logger = logging.getLogger("graphiti_service")


class GraphitiService:
    """
    Clean service abstraction for Graphiti temporal knowledge graph operations.
    Maintains a graceful degradation strategy when Neo4j is unconfigured or unreachable.
    """

    def __init__(self) -> None:
        self._client: Any = None
        self._is_connected: bool = False
        self._initialization_attempted: bool = False

    @property
    def is_available(self) -> bool:
        """Returns True only if Graphiti is properly connected and ready."""
        return self._is_connected

    async def initialize(self) -> bool:
        """
        Initializes Graphiti client if Neo4j and required credentials are configured.
        Fails gracefully without raising exceptions if connection cannot be established.
        """
        self._initialization_attempted = True
        uri = settings.effective_neo4j_uri
        user = settings.effective_neo4j_user
        password = settings.neo4j_password

        # Check if basic configuration is present
        if not uri or not user or not password:
            logger.info(
                "Graphiti/Neo4j is not configured (missing NEO4J_URI, NEO4J_USER, or NEO4J_PASSWORD). "
                "Graphiti service will run in graceful disconnected mode."
            )
            self._is_connected = False
            return False

        try:
            from graphiti_core import Graphiti  # type: ignore

            logger.info("Connecting to Graphiti/Neo4j at %s (user: %s)...", uri, user)
            self._client = Graphiti(
                uri=uri,
                user=user,
                password=password,
            )

            # Build indices and verify connectivity if possible
            if hasattr(self._client, "build_indices_and_constraints"):
                await self._client.build_indices_and_constraints()

            self._is_connected = True
            logger.info("Graphiti successfully initialized and connected to Neo4j.")
            return True
        except ImportError:
            logger.warning("graphiti-core package is not installed. Disabling Graphiti service.")
            self._is_connected = False
            return False
        except Exception as exc:
            logger.warning(
                "Failed to connect to Graphiti/Neo4j (%s). "
                "Backend will continue normally without temporal knowledge features.",
                exc,
            )
            self._client = None
            self._is_connected = False
            return False

    async def close(self) -> None:
        """Gracefully closes Neo4j driver connection if active."""
        if self._client and self._is_connected:
            try:
                if hasattr(self._client, "close"):
                    await self._client.close()
                logger.info("Graphiti connection closed.")
            except Exception as exc:
                logger.debug("Error closing Graphiti client: %s", exc)
            finally:
                self._is_connected = False
                self._client = None

    async def add_assessment_context(
        self,
        user_id: str,
        session_id: str,
        role_id: str,
        role_title: str,
        focus_competencies: list[str] | None = None,
        duration: str = "standard",
    ) -> bool:
        """
        Records the initiation of an assessment session into the candidate's temporal graph.
        """
        if not self.is_available:
            return False

        try:
            timestamp = datetime.now(timezone.utc)
            focus_str = ", ".join(focus_competencies or [])
            content = (
                f"Candidate {user_id} started assessment session {session_id} targeting role "
                f"'{role_title}' (ID: {role_id}) with duration '{duration}'. "
                f"Focus competencies: [{focus_str}]."
            )
            await self._client.add_episode(
                name=f"assessment_start_{session_id}",
                episode_body=content,
                source_description="assessment_engine",
                reference_time=timestamp,
                group_id=user_id,
            )
            return True
        except Exception as exc:
            logger.warning("Graphiti add_assessment_context failed: %s", exc)
            return False

    async def add_answer_evidence(
        self,
        user_id: str,
        session_id: str,
        question_id: str,
        competency_id: str,
        concept: str,
        status: str,
        explanation: str = "",
        confidence: float = 0.0,
    ) -> bool:
        """
        Records candidate answer evidence for a specific concept tested by a question.
        Status: 'demonstrated' | 'partial' | 'missing'
        """
        if not self.is_available:
            return False

        try:
            timestamp = datetime.now(timezone.utc)
            sentiment_action = (
                "successfully demonstrated mastery of"
                if status == "demonstrated"
                else "partially answered questions regarding"
                if status == "partial"
                else "struggled with and missed"
            )
            content = (
                f"In assessment session {session_id}, candidate {user_id} attempted question {question_id} "
                f"testing competency {competency_id}. Candidate {sentiment_action} concept '{concept}'. "
                f"Evaluation notes: {explanation} (confidence: {confidence:.2f})."
            )
            await self._client.add_episode(
                name=f"evidence_{session_id}_{question_id}_{concept[:20]}",
                episode_body=content,
                source_description="answer_evaluator",
                reference_time=timestamp,
                group_id=user_id,
            )
            return True
        except Exception as exc:
            logger.warning("Graphiti add_answer_evidence failed: %s", exc)
            return False

    async def add_skill_update(
        self,
        user_id: str,
        competency_id: str,
        competency_name: str,
        previous_score: int | None,
        new_score: int,
        evidence_summary: str = "",
        trend: str = "stable",
    ) -> bool:
        """
        Records a competency score transition in the user's temporal skill narrative.
        Example:
          Previous: 44, Current: 57
          Evidence: Failed concurrency debugging, passed execution tracing.
        """
        if not self.is_available:
            return False

        try:
            timestamp = datetime.now(timezone.utc)
            prev_str = f"{previous_score}" if previous_score is not None else "unassessed"
            delta = f"{new_score - previous_score:+d}" if previous_score is not None else "initial"
            content = (
                f"Candidate {user_id} skill update for competency '{competency_name}' ({competency_id}): "
                f"Score adjusted from {prev_str} to {new_score} (change: {delta}, trend: {trend}). "
                f"Observed evidence: {evidence_summary}."
            )
            await self._client.add_episode(
                name=f"skill_update_{user_id}_{competency_id}_{new_score}",
                episode_body=content,
                source_description="skill_estimator",
                reference_time=timestamp,
                group_id=user_id,
            )
            return True
        except Exception as exc:
            logger.warning("Graphiti add_skill_update failed: %s", exc)
            return False

    async def add_improvement_activity(
        self,
        user_id: str,
        competency_id: str,
        task_title: str,
        completed: bool,
    ) -> bool:
        """
        Records candidate progress on recommended improvement activities.
        """
        if not self.is_available:
            return False

        try:
            timestamp = datetime.now(timezone.utc)
            state = "completed" if completed else "started"
            content = (
                f"Candidate {user_id} {state} improvement task '{task_title}' "
                f"for competency {competency_id}."
            )
            await self._client.add_episode(
                name=f"task_{user_id}_{competency_id}_{state}",
                episode_body=content,
                source_description="improvement_plan",
                reference_time=timestamp,
                group_id=user_id,
            )
            return True
        except Exception as exc:
            logger.warning("Graphiti add_improvement_activity failed: %s", exc)
            return False

    async def search_user_context(
        self,
        user_id: str,
        query: str,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Searches candidate contextual memory for relevant history, weaknesses, or prior attempts.
        Returns a list of simplified context records.
        """
        if not self.is_available:
            return []

        try:
            results = await self._client.search(
                query=query,
                group_id=user_id,
                num_results=limit,
            )
            # Normalize Graphiti search result items
            normalized = []
            for item in (results or []):
                normalized.append({
                    "content": getattr(item, "content", str(item)),
                    "score": getattr(item, "score", None),
                    "created_at": getattr(item, "created_at", None),
                })
            return normalized
        except Exception as exc:
            logger.warning("Graphiti search_user_context failed: %s", exc)
            return []


# Global singleton service instance
graphiti_service = GraphitiService()
