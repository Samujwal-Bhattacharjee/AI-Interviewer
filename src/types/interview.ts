export type VoiceState = 'idle' | 'listening' | 'transcribing' | 'evaluating' | 'speaking' | 'complete';

export interface InterviewEvent {
  type: 
    | 'question.started'
    | 'audio.listening'
    | 'audio.transcribing'
    | 'answer.received'
    | 'answer.evaluating'
    | 'skill.updated'
    | 'difficulty.changed'
    | 'question.completed'
    | 'interview.completed';
  sessionId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface LiveInterviewState {
  sessionId: string;
  currentQuestion: import('./assessment').InterviewQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  voiceState: VoiceState;
  transcript: string;
  adaptiveState: import('./assessment').AdaptiveState;
  skillEstimates: import('./skills').SkillEstimate[];
  isComplete: boolean;
  // Future voice pipeline
  audioStream?: MediaStream;
  ttsAudio?: HTMLAudioElement;
}
