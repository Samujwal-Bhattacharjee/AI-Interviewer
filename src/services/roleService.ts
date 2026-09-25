/**
 * roleService.ts — Phase 2: Real FastAPI integration.
 *
 * GET /api/roles              → getTargetRoles()
 * GET /api/roles/{id}         → getRoleById(id)
 * GET /api/roles/{id}/blueprint → getAssessmentBlueprint(id)
 */

import { apiClient, DATA_MODE, delay } from '../lib/api';
import { mockRoles } from '../mock/roles';
import type { TargetRole, RoleBlueprint, RoleLevel } from '../types/roles';

/** Maps a raw backend role object (snake_case) to the frontend TargetRole type. */
function mapRole(raw: Record<string, unknown>): TargetRole {
  const competencies = ((raw.competencies as Record<string, unknown>[]) ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    category: c.category as string,
    description: (c.description as string) ?? '',
    subskills: (c.subskills as string[]) ?? [],
  }));

  const requirements = ((raw.requirements as Record<string, unknown>[]) ?? []).map((r) => ({
    competencyId: ((r.competency_id ?? r.competencyId) as string) ?? '',
    targetLevel: ((r.target_level ?? r.targetLevel) as number) ?? 70,
    importance: ((r.importance as 'critical' | 'high' | 'medium' | 'low') ?? 'medium'),
  }));

  return {
    id: raw.id as string,
    title: raw.title as string,
    level: raw.level as RoleLevel,
    description: (raw.description as string) ?? '',
    requirements,
    technologies: (raw.technologies as string[]) ?? [],
    responsibilities: (raw.responsibilities as string[]) ?? [],
    competencies,
  };
}

export async function getTargetRoles(): Promise<TargetRole[]> {
  if (DATA_MODE === 'mock') {
    await delay(400);
    return mockRoles;
  }
  const res = await apiClient.get<Record<string, unknown>[]>('/api/roles');
  return res.data.map(mapRole);
}

export async function getRoleById(roleId: string): Promise<TargetRole | undefined> {
  if (DATA_MODE === 'mock') {
    await delay(200);
    return mockRoles.find((r) => r.id === roleId);
  }
  try {
    const res = await apiClient.get<Record<string, unknown>>(`/api/roles/${roleId}`);
    return mapRole(res.data);
  } catch {
    return undefined;
  }
}

export async function getAssessmentBlueprint(roleId: string): Promise<RoleBlueprint> {
  if (DATA_MODE === 'mock') {
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

  const res = await apiClient.get<{
    role_id: string;
    competency_areas: {
      competency_id: string;
      concepts: string[];
      question_areas: string[];
      difficulty_range: { min: number; max: number };
    }[];
    estimated_questions: number;
    focus_areas: string[];
  }>(`/api/roles/${roleId}/blueprint`);

  const d = res.data;
  return {
    roleId: d.role_id,
    competencyAreas: d.competency_areas.map((a) => ({
      competencyId: a.competency_id,
      concepts: a.concepts,
      questionAreas: a.question_areas,
      difficultyRange: a.difficulty_range,
    })),
    estimatedQuestions: d.estimated_questions,
    focusAreas: d.focus_areas,
  };
}
