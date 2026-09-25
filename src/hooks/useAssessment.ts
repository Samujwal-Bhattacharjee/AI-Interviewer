import { useQuery } from '@tanstack/react-query';
import { getTargetRoles, getRoleById, getAssessmentBlueprint } from '../services/roleService';
import { createSession } from '../services/assessmentService';
import type { AssessmentConfig } from '../types/assessment';
import { useMutation } from '@tanstack/react-query';

export function useTargetRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: getTargetRoles,
  });
}

export function useRole(roleId: string | null) {
  return useQuery({
    queryKey: ['role', roleId],
    queryFn: () => getRoleById(roleId!),
    enabled: !!roleId,
  });
}

export function useAssessmentBlueprint(roleId: string | null) {
  return useQuery({
    queryKey: ['blueprint', roleId],
    queryFn: () => getAssessmentBlueprint(roleId!),
    enabled: !!roleId,
  });
}

export function useCreateSession() {
  return useMutation({
    mutationFn: (config: AssessmentConfig) => createSession(config),
  });
}
