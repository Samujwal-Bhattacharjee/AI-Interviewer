export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type TrendDirection = 'up' | 'down' | 'stable';
export type EstimatedLevel = 'novice' | 'foundational' | 'developing' | 'proficient' | 'advanced' | 'expert';

export interface SkillEstimate {
  competencyId: string;
  score: number; // 0-100
  estimatedLevel: EstimatedLevel;
  confidence: number; // 0-1
  confidenceLevel: ConfidenceLevel;
  evidenceCount: number;
  trend: TrendDirection;
  updatedAt: string;
  // Future Graphiti fields
  skillHistory?: HistoricalDataPoint[];
  recentEvidence?: string[];
}

export interface HistoricalDataPoint {
  sessionId: string;
  score: number;
  timestamp: string;
  evidenceCount: number;
}

export interface GapAnalysis {
  competencyId: string;
  competencyName: string;
  currentScore: number;
  targetScore: number;
  gap: number; // negative = below target
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ImprovementTask {
  id: string;
  competencyId: string;
  title: string;
  description: string;
  observedWeakness: string;
  estimatedTime: string;
  successCriteria: string[];
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface ImprovementPlan {
  userId: string;
  generatedAt: string;
  tasks: ImprovementTask[];
  focusCompetencies: string[];
  estimatedImprovement: number;
}

export interface UserProfile {
  id: string;
  name: string;
  targetRoleId: string;
  createdAt: string;
  // Future Graphiti fields
  previousAttempts?: number;
  recommendedFocus?: string[];
}
