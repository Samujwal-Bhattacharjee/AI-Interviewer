import type { AssessmentSession, AdaptiveState } from '../types/assessment';

export const mockSession: AssessmentSession = {
  id: 'session-003',
  userId: 'user-001',
  targetRoleId: 'role-001',
  startedAt: '2026-09-24T01:00:00Z',
  status: 'active',
  questionCount: 10,
  currentQuestionIndex: 3,
  focusCompetencies: ['comp-dsa', 'comp-debugging', 'comp-python'],
  duration: 'standard',
};

export const mockAdaptiveState: AdaptiveState = {
  currentDifficulty: 'hard',
  searchRegion: { lower: 'medium', upper: 'hard' },
  lastAction: 'increase',
  evidenceAnalyzed: true,
  currentEstimate: 72,
};
