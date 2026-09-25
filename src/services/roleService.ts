/**
 * roleService.ts
 *
 * Phase 1: Returns mock data with simulated latency.
 * Phase 2: Replace mock return with: return apiClient.get('/api/roles').then(r => r.data)
 *
 * FastAPI endpoints:
 *   GET  /api/roles              → getTargetRoles()
 *   GET  /api/roles/{id}         → getRoleById(id)
 *   GET  /api/roles/{id}/blueprint → getAssessmentBlueprint(id)
 */

import { delay } from '../lib/api';
import { mockRoles } from '../mock/roles';
import type { TargetRole, RoleBlueprint } from '../types/roles';

export async function getTargetRoles(): Promise<TargetRole[]> {
  await delay(400);
  return mockRoles;
}

export async function getRoleById(roleId: string): Promise<TargetRole | undefined> {
  await delay(200);
  return mockRoles.find((r) => r.id === roleId);
}

export async function getAssessmentBlueprint(roleId: string): Promise<RoleBlueprint> {
  await delay(600);
  const role = mockRoles.find((r) => r.id === roleId);
  if (!role) throw new Error(`Role ${roleId} not found`);

  return {
    roleId,
    competencyAreas: role.competencies.map((c) => ({
      competencyId: c.id,
      concepts: c.subskills,
      questionAreas: c.subskills.slice(0, 3),
      difficultyRange: { min: 30, max: 80 },
    })),
    estimatedQuestions: 10,
    focusAreas: role.competencies.slice(0, 3).map((c) => c.name),
  };
}
