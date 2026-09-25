/**
 * skillService.ts
 *
 * Phase 1: Returns mock skill estimates and improvement plan.
 * Phase 2: Replace with:
 *
 *   GET  /api/users/{id}/skills         → getSkillProfile(userId)
 *   GET  /api/users/{id}/plan           → getImprovementPlan(userId)
 *   POST /api/reassess                  → startReassessment(userId, competencyId)
 *
 * Future Graphiti integration:
 *   Graphiti context fields provided by FastAPI from the graph layer:
 *     - skillHistory: temporal skill estimates across sessions
 *     - recentEvidence: evidence items from recent answers
 *     - confidence: per-competency confidence scores
 *     - previousAttempts: count and quality of prior attempts
 *     - targetGap: delta between current estimate and role requirement
 *     - recommendedFocus: competency to focus on in reassessment
 */

import { delay } from '../lib/api';
import { mockSkillEstimates, mockGapAnalysis, mockImprovementPlan } from '../mock/skills';
import type { SkillEstimate, GapAnalysis, ImprovementPlan } from '../types/skills';

export async function getSkillProfile(_userId: string): Promise<SkillEstimate[]> {
  await delay(500);
  return mockSkillEstimates;
}

export async function getGapAnalysis(_userId: string, _roleId: string): Promise<GapAnalysis[]> {
  await delay(400);
  return mockGapAnalysis;
}

export async function getImprovementPlan(_userId: string): Promise<ImprovementPlan> {
  await delay(600);
  return mockImprovementPlan;
}

export async function startReassessment(_userId: string, _competencyId: string): Promise<{ sessionId: string }> {
  await delay(800);
  return { sessionId: `session-reassess-${Date.now()}` };
}
