/**
 * interviewService.ts
 *
 * Phase 1: Returns mock questions and simulates adaptive decisions.
 * Phase 2: Replace with:
 *
 *   POST /api/sessions/{id}/next-question  → getNextQuestion(sessionId)
 *   POST /api/sessions/{id}/answers        → submitAnswer(sessionId, answer)
 *
 * Future WebSocket integration point:
 *   Connect: ws://localhost:8000/ws/sessions/{sessionId}
 *   Events handled:
 *     question.started, audio.listening, audio.transcribing,
 *     answer.received, answer.evaluating, skill.updated,
 *     difficulty.changed, question.completed, interview.completed
 *
 * Future STT/TTS integration point:
 *   - STT: navigator.mediaDevices.getUserMedia() → MediaRecorder → send audio chunks
 *   - TTS: receive text from FastAPI → Web Speech API or ElevenLabs audio stream
 */

import { delay } from '../lib/api';
import { mockQuestions } from '../mock/questions';
import type { InterviewQuestion, QuestionAttempt, AnswerEvidence } from '../types/assessment';

let questionIndex = 0;

export async function getNextQuestion(sessionId: string): Promise<InterviewQuestion> {
  await delay(800);
  const question = mockQuestions[questionIndex % mockQuestions.length];
  questionIndex++;
  return question;
}

export async function submitAnswer(
  sessionId: string,
  answer: { questionId: string; answerText: string; transcript: string }
): Promise<QuestionAttempt> {
  await delay(1500); // Simulates LLM evaluation time

  const mockEvidence: AnswerEvidence[] = [
    { concept: 'core concept', status: 'demonstrated', explanation: 'Clearly explained', confidence: 0.85 },
    { concept: 'secondary concept', status: 'partial', explanation: 'Partially addressed', confidence: 0.6 },
    { concept: 'edge case', status: 'missing', explanation: 'Not mentioned', confidence: 0.9 },
  ];

  return {
    id: `attempt-${Date.now()}`,
    sessionId,
    questionId: answer.questionId,
    transcript: answer.transcript,
    answerText: answer.answerText,
    correctness: 0.72,
    evidence: mockEvidence,
    difficulty: 'medium',
    createdAt: new Date().toISOString(),
  };
}

export async function completeInterview(sessionId: string): Promise<void> {
  await delay(500);
  // Future: POST /api/sessions/{id}/complete
}
