"""
app/services/llm_service.py — Clean, provider-agnostic LLM service abstraction.

Responsibilities:
1. Dynamic adaptive interview question generation tailored to role, level,
   competency, difficulty, and interview history.
2. Candidate answer evaluation against expected concepts with evidence extraction.
3. Diagnostic summary and actionable recommendations for final assessment report.

Design:
- Uses OpenAI-compatible chat completions endpoint (Groq, OpenAI, Together, Ollama, etc.)
- Enforces structured JSON output validated via Pydantic
- Maintains state isolation: persistent state lives in the database and is passed in as context
- Provides high-quality deterministic fallback when no LLM key is configured
"""
import json
import logging
from typing import Any, Optional
from pydantic import BaseModel, Field
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


# ── Pydantic Schemas for Structured LLM Output ───────────────────────────────

class LLMQuestionOutput(BaseModel):
    question: str = Field(description="The spoken interview question prompt")
    question_type: str = Field(
        default="applied",
        description="One of: conceptual, analytical, applied, behavioral, technical"
    )
    expected_concepts: list[str] = Field(
        default_factory=list,
        description="4 to 6 specific key concepts or technical criteria expected in a strong answer"
    )
    follow_up_prompts: list[str] = Field(
        default_factory=list,
        description="1 to 2 follow-up probing questions to deepen the discussion"
    )


class LLMEvidenceItem(BaseModel):
    concept: str
    status: str  # "demonstrated" | "partial" | "missing"
    explanation: str
    confidence: float = 0.85


class LLMEvaluationOutput(BaseModel):
    correctness: float = Field(ge=0.0, le=1.0, description="Overall correctness score between 0.0 and 1.0")
    assessment: str = Field(description="One of: demonstrated, partial, missing")
    confidence: float = Field(default=0.88, ge=0.5, le=1.0)
    concepts_demonstrated: list[str] = Field(default_factory=list)
    concepts_missing: list[str] = Field(default_factory=list)
    evidence: list[LLMEvidenceItem] = Field(default_factory=list)


class LLMReportOutput(BaseModel):
    summary: str = Field(description="Comprehensive multi-paragraph diagnostic evaluation summary")
    recommendations: list[str] = Field(description="3 to 5 prioritized, actionable learning recommendations")


# ── LLM Service Implementation ──────────────────────────────────────────────

class LLMService:
    def __init__(self):
        self._api_key = settings.effective_llm_api_key
        self._base_url = settings.effective_llm_base_url.rstrip("/")
        self._model = settings.effective_llm_model

    def is_available(self) -> bool:
        """Returns True if an LLM API key is configured."""
        return bool(self._api_key and self._api_key.strip())

    async def _call_chat_completion(self, messages: list[dict[str, str]], temperature: float = 0.3) -> dict[str, Any]:
        """Calls the OpenAI-compatible chat completions endpoint with structured JSON output."""
        if not self.is_available():
            raise RuntimeError("LLM API key is not configured.")

        url = f"{self._base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
            "response_format": {"type": "json_object"},
            "max_tokens": 1500,
        }

        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(url, headers=headers, json=payload)

        if resp.status_code != 200:
            logger.error(f"LLM API error {resp.status_code}: {resp.text[:300]}")
            raise RuntimeError(f"LLM API error ({resp.status_code}): {resp.text[:200]}")

        data = resp.json()
        raw_content = data["choices"][0]["message"]["content"]
        try:
            return json.loads(raw_content)
        except json.JSONDecodeError as exc:
            logger.error(f"Failed to parse LLM response as JSON: {raw_content[:200]}")
            raise ValueError(f"LLM did not return valid JSON: {exc}") from exc

    async def generate_question(
        self,
        role_title: str,
        role_level: str,
        competency_name: str,
        competency_id: str,
        difficulty: str,
        question_number: int,
        total_questions: int,
        previous_questions: list[str],
        previous_attempts_summary: list[str],
    ) -> LLMQuestionOutput:
        """
        Generates a new adaptive interview question tailored to the candidate's
        target role, competency, difficulty, and interview history.
        """
        system_prompt = (
            "You are an expert technical interviewer conducting an adaptive mock interview.\n"
            f"Target Role: {role_level.capitalize()} {role_title}\n"
            f"Competency to Assess: {competency_name} ({competency_id})\n"
            f"Target Difficulty Level: {difficulty.upper()} (Scale: foundational -> easy -> medium -> hard -> expert)\n"
            f"Progress: Question {question_number} of {total_questions}\n\n"
            "Guidelines:\n"
            "1. Craft a natural, spoken interview question directly addressing this competency at the specified difficulty.\n"
            "2. For 'foundational' / 'easy': assess core principles, definitions, and standard trade-offs.\n"
            "3. For 'medium': assess practical application, code structure, performance, or debugging.\n"
            "4. For 'hard' / 'expert': assess edge cases, high concurrency, distributed systems, deep internals, or complex diagnosis.\n"
            "5. Do NOT repeat or closely rephrase any previously asked question.\n"
            "6. Provide 4 to 6 specific key concepts/keywords expected in a competent answer.\n"
            "7. Provide 1 to 2 realistic follow-up prompts.\n"
            "Return ONLY valid JSON matching this schema:\n"
            "{\n"
            '  "question": "<natural interview question>",\n'
            '  "question_type": "conceptual" | "analytical" | "applied" | "technical",\n'
            '  "expected_concepts": ["concept1", "concept2", "concept3", "concept4"],\n'
            '  "follow_up_prompts": ["follow-up 1", "follow-up 2"]\n'
            "}"
        )

        user_content = ""
        if previous_questions:
            user_content += "Previously asked questions in this session:\n" + "\n".join(f"- {q}" for q in previous_questions) + "\n\n"
        if previous_attempts_summary:
            user_content += "Summary of candidate's prior performance:\n" + "\n".join(f"- {s}" for s in previous_attempts_summary) + "\n\n"

        user_content += f"Generate the next question ({difficulty.upper()} difficulty for {competency_name})."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        parsed = await self._call_chat_completion(messages, temperature=0.4)
        return LLMQuestionOutput.model_validate(parsed)

    async def evaluate_answer(
        self,
        question: str,
        expected_concepts: list[str],
        competency_name: str,
        competency_id: str,
        transcript: str,
        role_title: str,
        role_level: str,
        difficulty: str,
    ) -> LLMEvaluationOutput:
        """
        Evaluates a candidate's spoken response against expected concepts.
        Extracts concept-level evidence and calculates a correctness score.
        """
        system_prompt = (
            "You are an expert technical interviewer evaluating a candidate's spoken response.\n"
            f"Target Role: {role_level.capitalize()} {role_title}\n"
            f"Competency: {competency_name} ({competency_id})\n"
            f"Question Difficulty: {difficulty.upper()}\n"
            f"Question Asked: \"{question}\"\n"
            f"Expected Concepts: {json.dumps(expected_concepts)}\n\n"
            "Instructions:\n"
            "1. For each expected concept, decide whether the candidate demonstrated it:\n"
            "   - 'demonstrated': clearly explained, correctly applied, or sound reasoning shown.\n"
            "   - 'partial': mentioned or hinted at but lacking depth or clarity.\n"
            "   - 'missing': omitted, incorrect, or contradicted.\n"
            "2. Provide a 1-sentence factual explanation for each concept evidence item.\n"
            "3. Compute overall correctness between 0.0 and 1.0.\n"
            "4. Set overall assessment: 'demonstrated' (if correctness >= 0.70), 'partial' (0.35 to 0.69), 'missing' (< 0.35).\n"
            "Return ONLY valid JSON matching this schema:\n"
            "{\n"
            '  "correctness": <float 0.0-1.0>,\n'
            '  "assessment": "demonstrated" | "partial" | "missing",\n'
            '  "confidence": <float 0.6-0.98>,\n'
            '  "concepts_demonstrated": ["concept1", ...],\n'
            '  "concepts_missing": ["concept2", ...],\n'
            '  "evidence": [\n'
            '    {\n'
            '      "concept": "<exact concept name>",\n'
            '      "status": "demonstrated" | "partial" | "missing",\n'
            '      "explanation": "<factual rationale>",\n'
            '      "confidence": <float 0.6-0.98>\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        user_content = f'Candidate Spoken Answer Transcript:\n"""{transcript}"""'

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        parsed = await self._call_chat_completion(messages, temperature=0.1)
        return LLMEvaluationOutput.model_validate(parsed)

    async def generate_report(
        self,
        role_title: str,
        role_level: str,
        overall_score: int,
        skill_estimates: list[dict[str, Any]],
        gaps: list[dict[str, Any]],
        attempts: list[dict[str, Any]],
    ) -> LLMReportOutput:
        """
        Synthesizes a comprehensive diagnostic report and actionable recommendations
        grounded in the candidate's actual interview trajectory.
        """
        system_prompt = (
            "You are a Principal Engineering Director and Senior Technical Assessor.\n"
            f"Target Role: {role_level.capitalize()} {role_title}\n"
            f"Overall Demonstrated Score: {overall_score}/100\n\n"
            "Review the candidate's complete assessment trajectory including verified evidence, "
            "competency scores, and identified gaps.\n"
            "Provide:\n"
            "1. 'summary': A comprehensive 2-3 paragraph diagnostic summary analyzing performance, "
            "highlighting concrete technical strengths demonstrated during the interview, "
            "identifying specific failure modes or knowledge gaps, and giving a candid assessment of readiness.\n"
            "2. 'recommendations': 3 to 5 concrete, actionable learning and practice recommendations "
            "(specific engineering topics, architectures to study, or exercises to complete) to close identified gaps.\n"
            "Return ONLY valid JSON matching this schema:\n"
            "{\n"
            '  "summary": "<detailed diagnostic assessment>",\n'
            '  "recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"]\n'
            "}"
        )

        user_content = (
            f"Competency Estimates:\n{json.dumps(skill_estimates, indent=2)}\n\n"
            f"Gap Analysis:\n{json.dumps(gaps, indent=2)}\n\n"
            f"Interview Questions & Attempts Summary:\n{json.dumps(attempts, indent=2)}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        parsed = await self._call_chat_completion(messages, temperature=0.3)
        return LLMReportOutput.model_validate(parsed)


# Global singleton instance
llm_service = LLMService()
