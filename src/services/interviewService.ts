/**
 * interviewService.ts — Phase 3: Real FastAPI integration & structured evaluation.
 *
 * POST /api/sessions/{id}/next-question  → getNextQuestion(sessionId)
 * POST /api/sessions/{id}/answers        → submitAnswer(sessionId, answer)
 */

import { apiClient, DATA_MODE, delay } from '../lib/api';
import { mockQuestions } from '../mock/questions';
import type { InterviewQuestion, QuestionAttempt, AnswerEvidence, AdaptiveState } from '../types/assessment';
import type { SkillEstimate, EstimatedLevel } from '../types/skills';

let mockQuestionIndex = 0;

// ── Type: backend NextQuestionResponse (snake_case) ───────────────────────────
interface BackendQuestion {
  question_id: string;
  competency: { id: string; name: string };
  difficulty: string;
  question_type: string;
  question: string;
  question_text?: string;
  localized_question_text?: string | null;
  question_language?: string;
  expected_concepts: string[];
  follow_up_prompts: string[];
  question_number: number;
  total_questions: number;
  question_translated?: string | null;
  target_language?: string;
  interview_mode?: InterviewQuestion['interviewMode'];
}

// ── Type: backend SubmitAnswerResponse (snake_case) ───────────────────────────
interface BackendAttempt {
  attempt_id: string;
  question_id: string;
  correctness: number;
  assessment?: string;
  confidence?: number;
  concepts_demonstrated?: string[];
  concepts_missing?: string[];
  evidence: { concept: string; status: string; explanation: string; confidence: number }[];
  updated_skill_estimates: Record<string, unknown>[];
  adaptive_state: {
    current_difficulty: string;
    search_region: { lower: string; upper: string };
    last_action: string | null;
    evidence_analyzed: boolean;
    current_estimate: number;
  };
  professional_english_translation?: string | null;
  detected_language?: string | null;
}

export interface SubmitAnswerResult {
  attempt: QuestionAttempt;
  updatedSkillEstimates: SkillEstimate[];
  adaptiveState: AdaptiveState;
  assessment: string;
  confidence: number;
  conceptsDemonstrated: string[];
  conceptsMissing: string[];
  professionalEnglishTranslation?: string | null;
}

function mapQuestion(raw: BackendQuestion): InterviewQuestion {
  return {
    id: raw.question_id,
    competencyId: raw.competency.id,
    difficulty: raw.difficulty as InterviewQuestion['difficulty'],
    question: raw.question_text || raw.question,
    questionText: raw.question_text || raw.question,
    localizedQuestionText: raw.localized_question_text ?? raw.question_translated ?? null,
    questionLanguage: raw.question_language || raw.target_language || 'en-IN',
    questionTranslated: raw.localized_question_text ?? raw.question_translated,
    targetLanguage: raw.target_language,
    interviewMode: raw.interview_mode,
    questionType: raw.question_type as InterviewQuestion['questionType'],
    expectedConcepts: raw.expected_concepts,
    followUpPrompts: raw.follow_up_prompts,
  };
}

import { getActiveSessionConfig } from './assessmentService';
import { mockDocumentQuestions } from '../mock/documentQuestions';

export async function getNextQuestion(sessionId: string): Promise<InterviewQuestion> {
  if (DATA_MODE === 'mock') {
    await delay(800);
    const sessionConfig = getActiveSessionConfig(sessionId);
    const isDocAssessment = sessionConfig?.assessmentType === 'faculty_assigned' || !!sessionConfig?.documentTitle;

    if (isDocAssessment) {
      const allowedTopics = sessionConfig?.topics?.map((t) => t.toLowerCase()) ?? ['processes', 'threads', 'scheduling'];
      const docQuestions = mockDocumentQuestions.filter((q) =>
        allowedTopics.some((at) => q.topicId.toLowerCase().includes(at) || at.includes(q.topicId.toLowerCase()))
      );
      const pool = docQuestions.length > 0 ? docQuestions : mockDocumentQuestions;
      const qItem = pool[mockQuestionIndex % pool.length];
      mockQuestionIndex++;

      return {
        id: qItem.id,
        competencyId: qItem.topicId === 'processes' ? 'comp-dsa' : qItem.topicId === 'threads' ? 'comp-python' : 'comp-debugging',
        difficulty: qItem.difficulty,
        question: qItem.question,
        questionText: qItem.question,
        questionType: 'technical',
        expectedConcepts: qItem.expectedConcepts,
        followUpPrompts: qItem.followUpPrompts,
        sourceType: 'DOCUMENT',
        documentId: qItem.documentId,
        documentTitle: qItem.documentTitle,
        topicId: qItem.topicId,
        topicName: qItem.topicName,
      };
    }

    const question = mockQuestions[mockQuestionIndex % mockQuestions.length];
    const sourceTypes = ['ROLE', 'RESUME', 'PROJECT', 'ADAPTIVE', 'FOLLOW_UP'] as const;
    const taggedQuestion: InterviewQuestion = {
      ...question,
      sourceType: sourceTypes[mockQuestionIndex % sourceTypes.length],
    };
    mockQuestionIndex++;
    return taggedQuestion;
  }
  const res = await apiClient.post<BackendQuestion>(
    `/api/sessions/${sessionId}/next-question`
  );
  return mapQuestion(res.data);
}

export async function submitAnswer(
  sessionId: string,
  answer: { questionId: string; answerText: string; transcript: string; durationMs?: number; language?: string }
): Promise<SubmitAnswerResult> {
  if (DATA_MODE === 'mock') {
    await delay(1500);
    const mockEvidence: AnswerEvidence[] = [
      { concept: 'core concept', status: 'demonstrated', explanation: 'Clearly explained', confidence: 0.85 },
      { concept: 'secondary concept', status: 'partial', explanation: 'Partially addressed', confidence: 0.6 },
      { concept: 'edge case', status: 'missing', explanation: 'Not mentioned', confidence: 0.9 },
    ];
    const attempt: QuestionAttempt = {
      id: `attempt-${Date.now()}`,
      sessionId,
      questionId: answer.questionId,
      transcript: answer.transcript,
      answerText: answer.answerText,
      correctness: 0.72,
      evidence: mockEvidence,
      difficulty: 'medium',
      createdAt: new Date().toISOString(),
      professionalEnglishTranslation: 'In professional engineering contexts: Specifically, the core architectural principle hinges on core concept and edge case handling.',
    };
    return {
      attempt,
      updatedSkillEstimates: [],
      adaptiveState: {
        currentDifficulty: 'medium',
        searchRegion: { lower: 'easy', upper: 'hard' },
        lastAction: 'probe',
        evidenceAnalyzed: true,
        currentEstimate: 60,
      },
      assessment: 'demonstrated',
      confidence: 0.85,
      conceptsDemonstrated: ['core concept'],
      conceptsMissing: ['edge case'],
      professionalEnglishTranslation: attempt.professionalEnglishTranslation,
    };
  }

  const res = await apiClient.post<BackendAttempt>(`/api/sessions/${sessionId}/answers`, {
    question_id: answer.questionId,
    transcript: answer.transcript,
    duration_ms: answer.durationMs ?? 0,
    language: answer.language ?? 'en-US',
  });

  const d = res.data;
  const evidence: AnswerEvidence[] = d.evidence.map((ev) => ({
    concept: ev.concept,
    status: ev.status as AnswerEvidence['status'],
    explanation: ev.explanation,
    confidence: ev.confidence,
  }));

  const attempt: QuestionAttempt = {
    id: String(d.attempt_id),
    sessionId,
    questionId: d.question_id,
    transcript: answer.transcript,
    answerText: answer.answerText,
    correctness: d.correctness,
    evidence,
    difficulty: (d.adaptive_state.current_difficulty as QuestionAttempt['difficulty']) ?? 'medium',
    createdAt: new Date().toISOString(),
    professionalEnglishTranslation: d.professional_english_translation,
  };

  const updatedSkillEstimates: SkillEstimate[] = (d.updated_skill_estimates ?? []).map((e) => ({
    competencyId: e.competency_id as string,
    score: e.score as number,
    confidence: e.confidence as number,
    confidenceLevel: e.confidence_level as SkillEstimate['confidenceLevel'],
    evidenceCount: e.evidence_count as number,
    estimatedLevel: (e.estimated_level as EstimatedLevel) ?? 'developing',
    trend: e.trend as SkillEstimate['trend'],
    updatedAt: e.updated_at as string,
  }));

  const adaptiveState: AdaptiveState = {
    currentDifficulty: d.adaptive_state.current_difficulty as AdaptiveState['currentDifficulty'],
    searchRegion: {
      lower: d.adaptive_state.search_region.lower as AdaptiveState['currentDifficulty'],
      upper: d.adaptive_state.search_region.upper as AdaptiveState['currentDifficulty'],
    },
    lastAction: d.adaptive_state.last_action as AdaptiveState['lastAction'],
    evidenceAnalyzed: d.adaptive_state.evidence_analyzed,
    currentEstimate: d.adaptive_state.current_estimate,
  };

  return {
    attempt,
    updatedSkillEstimates,
    adaptiveState,
    assessment: d.assessment ?? (d.correctness >= 0.7 ? 'demonstrated' : d.correctness >= 0.35 ? 'partial' : 'missing'),
    confidence: d.confidence ?? 0.85,
    conceptsDemonstrated: d.concepts_demonstrated ?? [],
    conceptsMissing: d.concepts_missing ?? [],
    professionalEnglishTranslation: d.professional_english_translation,
  };
}

export async function completeInterview(_sessionId: string): Promise<void> {
  // Session completes automatically on the backend when question_count is reached.
  await delay(0);
}
