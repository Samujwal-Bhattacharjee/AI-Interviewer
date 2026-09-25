/**
 * assessmentService.ts
 *
 * Phase 1: Returns mock data.
 * Phase 2: Replace mocks with FastAPI calls:
 *
 *   POST /api/sessions           → createSession(config)
 *   GET  /api/sessions/{id}      → getSession(id)
 *   POST /api/sessions/{id}/start → startInterview(id)
 *   GET  /api/sessions/{id}/report → getAssessmentReport(id)
 */

import { delay } from '../lib/api';
import { mockSession, mockAdaptiveState } from '../mock/assessment';
import type { AssessmentSession, AssessmentConfig, AdaptiveState } from '../types/assessment';

let sessionCounter = 4;

export async function createSession(config: AssessmentConfig): Promise<AssessmentSession> {
  await delay(500);
  const newSession: AssessmentSession = {
    id: `session-00${sessionCounter++}`,
    userId: 'user-001',
    targetRoleId: config.targetRoleId,
    startedAt: new Date().toISOString(),
    status: 'pending',
    questionCount: config.duration === 'quick' ? 5 : config.duration === 'standard' ? 10 : 20,
    currentQuestionIndex: 0,
    focusCompetencies: config.focusCompetencies,
    duration: config.duration,
  };
  return newSession;
}

export async function getSession(sessionId: string): Promise<AssessmentSession> {
  await delay(300);
  return { ...mockSession, id: sessionId };
}

export async function startInterview(sessionId: string): Promise<AssessmentSession> {
  await delay(400);
  return { ...mockSession, id: sessionId, status: 'active' };
}

export async function getAdaptiveState(sessionId: string): Promise<AdaptiveState> {
  await delay(200);
  return { ...mockAdaptiveState };
}
