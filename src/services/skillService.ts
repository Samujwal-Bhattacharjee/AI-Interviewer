/**
 * skillService.ts — User skill profile, gap analysis, and improvement plan.
 *
 * GET  /api/users/{id}/skills         → getSkillProfile(userId)
 * GET  /api/users/{id}/gaps           → getGapAnalysis(userId, roleId)
 * GET  /api/users/{id}/plan           → getImprovementPlan(userId)
 * POST /api/reassess                  → startReassessment(userId, competencyId)
 */

import { apiClient, DATA_MODE, delay } from '../lib/api';
import { mockSkillEstimates, mockGapAnalysis, mockImprovementPlan } from '../mock/skills';
import type { SkillEstimate, GapAnalysis, ImprovementPlan, EstimatedLevel } from '../types/skills';

export async function getSkillProfile(userId: string = 'user-001'): Promise<SkillEstimate[]> {
  if (DATA_MODE === 'mock') {
    await delay(500);
    return mockSkillEstimates;
  }

  const res = await apiClient.get<Record<string, unknown>[]>(`/api/users/${userId}/skills`);
  return res.data.map((e) => ({
    competencyId: e.competency_id as string,
    score: e.score as number,
    confidence: e.confidence as number,
    confidenceLevel: e.confidence_level as SkillEstimate['confidenceLevel'],
    evidenceCount: e.evidence_count as number,
    estimatedLevel: (e.estimated_level as EstimatedLevel) ?? 'developing',
    trend: e.trend as SkillEstimate['trend'],
    updatedAt: e.updated_at as string,
  }));
}

export async function getGapAnalysis(
  userId: string = 'user-001',
  roleId: string = 'role-001'
): Promise<GapAnalysis[]> {
  if (DATA_MODE === 'mock') {
    await delay(400);
    return mockGapAnalysis;
  }

  const res = await apiClient.get<Record<string, unknown>[]>(`/api/users/${userId}/gaps`, {
    params: { role_id: roleId },
  });

  return res.data.map((g) => ({
    competencyId: g.competency_id as string,
    competencyName: g.competency_name as string,
    currentScore: g.current_score as number,
    targetScore: g.target_score as number,
    gap: g.gap as number,
    priority: g.priority as GapAnalysis['priority'],
  }));
}

export async function getImprovementPlan(userId: string = 'user-001'): Promise<ImprovementPlan> {
  if (DATA_MODE === 'mock') {
    await delay(600);
    return mockImprovementPlan;
  }

  const res = await apiClient.get<Record<string, unknown>>(`/api/users/${userId}/plan`);
  const d = res.data;

  type RawTask = Record<string, unknown>;
  const tasks = ((d.tasks as RawTask[]) ?? []).map((t) => ({
    id: t.id as string,
    competencyId: t.competency_id as string,
    title: t.title as string,
    description: t.description as string,
    observedWeakness: t.observed_weakness as string,
    estimatedTime: t.estimated_time as string,
    priority: t.priority as 'critical' | 'high' | 'medium' | 'low',
    completed: Boolean(t.completed),
    successCriteria: (t.success_criteria as string[]) ?? [],
  }));

  return {
    userId: d.user_id as string,
    generatedAt: d.generated_at as string,
    focusCompetencies: (d.focus_competencies as string[]) ?? [],
    estimatedImprovement: d.estimated_improvement as number,
    tasks,
  };
}

export async function startReassessment(
  userId: string = 'user-001',
  competencyId: string = 'comp-debugging'
): Promise<{ sessionId: string }> {
  if (DATA_MODE === 'mock') {
    await delay(800);
    return { sessionId: `session-reassess-${Date.now()}` };
  }

  const res = await apiClient.post<{ session_id: string }>('/api/reassess', {
    user_id: userId,
    target_role_id: 'role-001',
    focus_competencies: [competencyId],
    duration: 'quick',
  });

  return { sessionId: res.data.session_id };
}
