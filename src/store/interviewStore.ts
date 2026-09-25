import { create } from 'zustand';
import type { VoiceState } from '../types/interview';
import type { InterviewQuestion, AdaptiveState, QuestionAttempt } from '../types/assessment';
import type { SkillEstimate } from '../types/skills';
import { mockSkillEstimates } from '../mock/skills';
import { mockAdaptiveState } from '../mock/assessment';

interface InterviewStore {
  // Session
  sessionId: string | null;
  targetRoleId: string | null;
  questionIndex: number;
  totalQuestions: number;
  isComplete: boolean;

  // Current question
  currentQuestion: InterviewQuestion | null;
  voiceState: VoiceState;
  transcript: string;
  attempts: QuestionAttempt[];

  // Live skill state — updated on every skill.updated WebSocket event
  skillEstimates: SkillEstimate[];
  adaptiveState: AdaptiveState;

  // Actions
  setSession: (sessionId: string, targetRoleId: string, total: number) => void;
  setQuestion: (question: InterviewQuestion, index: number) => void;
  setVoiceState: (state: VoiceState) => void;
  setTranscript: (transcript: string) => void;
  addAttempt: (attempt: QuestionAttempt) => void;
  updateSkillEstimate: (estimate: SkillEstimate) => void;
  updateAdaptiveState: (state: AdaptiveState) => void;
  completeInterview: () => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  targetRoleId: null,
  questionIndex: 0,
  totalQuestions: 10,
  isComplete: false,
  currentQuestion: null,
  voiceState: 'idle' as VoiceState,
  transcript: '',
  attempts: [] as QuestionAttempt[],
  skillEstimates: mockSkillEstimates,
  adaptiveState: mockAdaptiveState,
};

export const useInterviewStore = create<InterviewStore>((set) => ({
  ...initialState,

  setSession: (sessionId, targetRoleId, total) =>
    set({ sessionId, targetRoleId, totalQuestions: total }),

  setQuestion: (question, index) =>
    set({ currentQuestion: question, questionIndex: index, transcript: '', voiceState: 'idle' }),

  setVoiceState: (voiceState) => set({ voiceState }),

  setTranscript: (transcript) => set({ transcript }),

  addAttempt: (attempt) =>
    set((state) => ({ attempts: [...state.attempts, attempt] })),

  updateSkillEstimate: (estimate) =>
    set((state) => ({
      skillEstimates: state.skillEstimates.map((e) =>
        e.competencyId === estimate.competencyId ? estimate : e
      ),
    })),

  updateAdaptiveState: (adaptiveState) => set({ adaptiveState }),

  completeInterview: () => set({ isComplete: true, voiceState: 'complete' }),

  reset: () => set(initialState),
}));
