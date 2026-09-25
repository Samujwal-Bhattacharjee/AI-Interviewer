import { useQuery } from '@tanstack/react-query';
import { getSkillProfile, getGapAnalysis, getImprovementPlan } from '../services/skillService';

export function useSkillProfile(userId: string = 'user-001') {
  return useQuery({
    queryKey: ['skills', userId],
    queryFn: () => getSkillProfile(userId),
  });
}

export function useGapAnalysis(userId: string = 'user-001', roleId: string = 'role-001') {
  return useQuery({
    queryKey: ['gaps', userId, roleId],
    queryFn: () => getGapAnalysis(userId, roleId),
  });
}

export function useImprovementPlan(userId: string = 'user-001') {
  return useQuery({
    queryKey: ['plan', userId],
    queryFn: () => getImprovementPlan(userId),
  });
}
