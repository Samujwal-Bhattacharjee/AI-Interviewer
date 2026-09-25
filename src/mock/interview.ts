import type { LiveInterviewState } from '../types/interview';
import { mockSession, mockAdaptiveState } from './assessment';
import { mockQuestions } from './questions';
import { mockSkillEstimates } from './skills';

export const mockInterviewState: LiveInterviewState = {
  sessionId: mockSession.id,
  currentQuestion: mockQuestions[2],
  questionIndex: 3,
  totalQuestions: 10,
  voiceState: 'speaking',
  transcript: '',
  adaptiveState: mockAdaptiveState,
  skillEstimates: mockSkillEstimates,
  isComplete: false,
};
