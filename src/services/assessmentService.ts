/**
 * assessmentService.ts — Phase 2: Real FastAPI integration.
 *
 * POST /api/sessions           → createSession(config)
 * GET  /api/sessions/{id}      → getSession(id)
 * POST /api/sessions/{id}/start → startInterview(id)
 * GET  /api/sessions/{id}/report → getAssessmentReport(id)
 */

import { apiClient, DATA_MODE, delay } from '../lib/api';
import { mockSession, mockAdaptiveState } from '../mock/assessment';
import type { AssessmentSession, AssessmentConfig, AdaptiveState, AssessmentReport } from '../types/assessment';
import type { EstimatedLevel } from '../types/skills';

/** Maps the backend snake_case session object to the camelCase frontend type. */
function mapSession(raw: Record<string, unknown>): AssessmentSession {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    targetRoleId: raw.target_role_id as string,
    startedAt: raw.started_at as string,
    completedAt: (raw.completed_at as string | null) ?? undefined,
    status: raw.status as AssessmentSession['status'],
    questionCount: raw.question_count as number,
    currentQuestionIndex: raw.current_question_index as number,
    focusCompetencies: (raw.focus_competencies as string[]) ?? [],
    duration: raw.duration as AssessmentSession['duration'],
  };
}

export async function createSession(config: AssessmentConfig): Promise<AssessmentSession> {
  if (DATA_MODE === 'mock') {
    await delay(500);
    return {
      id: `session-00${Math.floor(Math.random() * 900 + 100)}`,
      userId: 'user-001',
      targetRoleId: config.targetRoleId,
      startedAt: new Date().toISOString(),
      status: 'pending',
      questionCount: config.duration === 'quick' ? 5 : config.duration === 'standard' ? 10 : 20,
      currentQuestionIndex: 0,
      focusCompetencies: config.focusCompetencies,
      duration: config.duration,
    };
  }

  const res = await apiClient.post<Record<string, unknown>>('/api/sessions', {
    user_id: 'user-001', // TODO: replace with real auth user id
    target_role_id: config.targetRoleId,
    level: config.level,
    focus_competencies: config.focusCompetencies,
    duration: config.duration,
  });

  return mapSession(res.data);
}

export async function getSession(sessionId: string): Promise<AssessmentSession> {
  if (DATA_MODE === 'mock') {
    await delay(300);
    return { ...mockSession, id: sessionId };
  }
  const res = await apiClient.get<Record<string, unknown>>(`/api/sessions/${sessionId}`);
  return mapSession(res.data);
}

export async function startInterview(sessionId: string): Promise<AssessmentSession> {
  if (DATA_MODE === 'mock') {
    await delay(400);
    return { ...mockSession, id: sessionId, status: 'active' };
  }
  // POST /api/sessions/{id}/start returns a StartSessionResponse:
  // { session, first_question, adaptive_state }
  // The first_question is consumed by useInterview.ts via getNextQuestion.
  const res = await apiClient.post<{ session: Record<string, unknown> }>(
    `/api/sessions/${sessionId}/start`
  );
  return mapSession(res.data.session);
}

export async function getAdaptiveState(sessionId: string): Promise<AdaptiveState> {
  if (DATA_MODE === 'mock') {
    await delay(200);
    return { ...mockAdaptiveState };
  }
  const res = await apiClient.get<{
    adaptive_state: {
      current_difficulty: string;
      search_region: { lower: string; upper: string };
      last_action: string | null;
      evidence_analyzed: boolean;
      current_estimate: number;
    };
  }>(`/api/sessions/${sessionId}/current-state`);
  const a = res.data.adaptive_state;
  return {
    currentDifficulty: a.current_difficulty as AdaptiveState['currentDifficulty'],
    searchRegion: {
      lower: a.search_region.lower as AdaptiveState['currentDifficulty'],
      upper: a.search_region.upper as AdaptiveState['currentDifficulty'],
    },
    lastAction: a.last_action as AdaptiveState['lastAction'],
    evidenceAnalyzed: a.evidence_analyzed,
    currentEstimate: a.current_estimate,
  };
}

export async function getAssessmentReport(sessionId: string): Promise<AssessmentReport> {
  if (DATA_MODE === 'mock') {
    await delay(400);
    return {
      sessionId,
      completedAt: new Date().toISOString(),
      targetRoleId: 'role-001',
      overallScore: 78,
      summary: 'Assessment complete. Skill profile updated.',
      skillEstimates: [],
      gapAnalysis: [],
      recommendations: [],
      evidence: [],
    };
  }

  const res = await apiClient.get<Record<string, unknown>>(`/api/sessions/${sessionId}/report`);
  const d = res.data;
  const skillEstimates = ((d.skill_estimates as Record<string, unknown>[]) ?? []).map((e) => ({
    competencyId: e.competency_id as string,
    score: e.score as number,
    confidence: e.confidence as number,
    confidenceLevel: e.confidence_level as 'low' | 'medium' | 'high',
    evidenceCount: e.evidence_count as number,
    estimatedLevel: (e.estimated_level as EstimatedLevel) ?? 'developing',
    trend: e.trend as 'up' | 'down' | 'stable',
    updatedAt: e.updated_at as string,
  }));

  const gapAnalysis = ((d.gaps as Record<string, unknown>[]) ?? []).map((g) => ({
    competencyId: g.competency_id as string,
    competencyName: g.competency_name as string,
    currentScore: g.current_score as number,
    targetScore: g.target_score as number,
    gap: g.gap as number,
    priority: g.priority as 'critical' | 'high' | 'medium' | 'low',
  }));

  const evidence = ((d.evidence as Record<string, unknown>[]) ?? []).map((ev) => ({
    questionId: ev.question_id as string,
    competencyId: ev.competency_id as string,
    concept: ev.concept as string,
    status: ev.status as 'demonstrated' | 'partial' | 'missing',
    explanation: ev.explanation as string,
    confidence: ev.confidence as number,
  }));

  return {
    sessionId: d.session_id as string,
    completedAt: d.completed_at as string,
    targetRoleId: d.target_role_id as string,
    overallScore: d.overall_score as number,
    summary: d.summary as string,
    skillEstimates,
    gapAnalysis,
    evidence,
    recommendations: (d.recommendations as string[]) ?? [],
  };
}
