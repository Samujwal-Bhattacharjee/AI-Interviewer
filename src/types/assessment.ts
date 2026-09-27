import type { Competency } from './roles';

export type Difficulty = 'foundational' | 'easy' | 'medium' | 'hard' | 'expert';
export type QuestionType = 'conceptual' | 'analytical' | 'applied' | 'behavioral' | 'technical';
export type AssessmentStatus = 'pending' | 'active' | 'completed' | 'abandoned';
export type AssessmentDuration = 'quick' | 'standard' | 'deep';
export type InterviewLanguageMode = 'native' | 'any_language' | 'standard' | 'mode1_native' | 'mode2_any_lang';

export interface InterviewQuestion {
  id: string;
  competencyId: string;
  difficulty: Difficulty;
  question: string;
  questionText?: string;
  localizedQuestionText?: string | null;
  questionLanguage?: string;
  questionTranslated?: string | null;
  targetLanguage?: string;
  interviewMode?: InterviewLanguageMode;
  questionType: QuestionType;
  expectedConcepts: string[];
  followUpPrompts?: string[];
  sourceType?: 'ROLE' | 'RESUME' | 'PROJECT' | 'DOCUMENT' | 'TOPIC' | 'FOLLOW_UP' | 'ADAPTIVE' | string;
  documentId?: string;
  documentTitle?: string;
  topicId?: string;
  topicName?: string;
}


export interface AnswerEvidence {
  concept: string;
  status: 'demonstrated' | 'partial' | 'missing';
  explanation: string;
  confidence: number; // 0-1
}

export interface QuestionAttempt {
  id: string;
  sessionId: string;
  questionId: string;
  transcript: string;
  answerText: string;
  correctness: number; // 0-1
  evidence: AnswerEvidence[];
  difficulty: Difficulty;
  createdAt: string;
  professionalEnglishTranslation?: string | null;
}

export interface AssessmentSession {
  id: string;
  userId: string;
  targetRoleId: string;
  startedAt: string;
  completedAt?: string;
  status: AssessmentStatus;
  questionCount: number;
  currentQuestionIndex: number;
  focusCompetencies: string[];
  duration: AssessmentDuration;
  interviewMode?: InterviewLanguageMode;
  targetLanguage?: string;
  language?: string;
  questionLanguage?: string;
  answerLanguage?: string;
  assessmentType?: 'career' | 'faculty_assigned';
  facultyAssessmentId?: string;
  documentId?: string;
  documentTitle?: string;
  topics?: string[];
}

export interface AssessmentConfig {
  targetRoleId: string;
  level: string;
  focusCompetencies: string[];
  duration: AssessmentDuration;
  /** Optional: matched resume profile id for personalized question weighting */
  resumeProfileId?: string | null;
  interviewMode?: InterviewLanguageMode;
  targetLanguage?: string;
  language?: string;
  questionLanguage?: string;
  answerLanguage?: string;
  assessmentType?: 'career' | 'faculty_assigned';
  facultyAssessmentId?: string;
  documentId?: string;
  documentTitle?: string;
  topics?: string[];
}

export interface AdaptiveState {
  currentDifficulty: Difficulty;
  searchRegion: { lower: Difficulty; upper: Difficulty };
  lastAction: 'increase' | 'decrease' | 'probe' | 'deepen' | 'gather_evidence' | null;
  evidenceAnalyzed: boolean;
  currentEstimate: number;
}

export interface ReportEvidence {
  questionId: string;
  competencyId: string;
  concept: string;
  status: 'demonstrated' | 'partial' | 'missing';
  explanation: string;
  confidence: number;
}

export interface CourseResource {
  id: string;
  title: string;
  provider: string;
  skill: string;
  resourceType: string;
  difficulty: string;
  estimatedDuration: string;
  priceType: 'free' | 'paid';
  url: string;
  reason: string;
  priority?: string;
  forCompetency?: string;
}

export interface ResourceRecommendations {
  free: CourseResource[];
  paid: CourseResource[];
  source: string;
}

export interface AssessmentReport {
  sessionId: string;
  completedAt: string;
  targetRoleId: string;
  competencies?: Competency[];
  skillEstimates: import('./skills').SkillEstimate[];
  gapAnalysis: import('./skills').GapAnalysis[];
  summary: string;
  overallScore: number;
  evidence?: ReportEvidence[];
  recommendations?: string[];
  resources?: ResourceRecommendations;
  questionSources?: Record<string, number>;
  documentTitle?: string;
  topicsEvaluated?: string[];
  assessmentType?: 'career' | 'faculty_assigned';
}
