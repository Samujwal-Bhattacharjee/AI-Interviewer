export type RoleLevel = 'beginner' | 'junior' | 'intermediate' | 'senior';

export interface Competency {
  id: string;
  name: string;
  category: string;
  description: string;
  subskills: string[];
}

export interface CompetencyRequirement {
  competencyId: string;
  targetLevel: number; // 0-100
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface TargetRole {
  id: string;
  title: string;
  level: RoleLevel;
  description: string;
  requirements: CompetencyRequirement[];
  competencies: Competency[];
  technologies: string[];
  responsibilities: string[];
}

export interface RoleBlueprint {
  roleId: string;
  competencyAreas: {
    competencyId: string;
    concepts: string[];
    questionAreas: string[];
    difficultyRange: { min: number; max: number };
  }[];
  estimatedQuestions: number;
  focusAreas: string[];
}
