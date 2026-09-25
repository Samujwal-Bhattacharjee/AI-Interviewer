/**
 * src/types/setup.ts — Assessment setup domain types.
 *
 * Covers the full entry flow:
 *   Sector → Role → Resume → Level → Focus → Duration → Session
 */

import type { AssessmentDuration } from './assessment';
import type { RoleLevel } from './roles';

// ── Sector / Role catalog ─────────────────────────────────────────────────────

export interface SectorRole {
  id: string;
  title: string;
  /** Which competency IDs map to this role in the question bank */
  competencyIds: string[];
  /** Tech stack for display */
  technologies: string[];
  /** Default target levels per competency (0-100) */
  targetLevels: Record<string, number>;
}

export interface Sector {
  id: string;
  label: string;
  roles: SectorRole[];
}

// ── Resume / candidate profile ────────────────────────────────────────────────

export interface ResumeProfile {
  id: string;
  /** Exact filename to match on */
  fileName: string;
  candidateName: string;
  profileTitle: string;
  /** Technologies / skills from the resume */
  skills: string[];
  /** Project names from the resume */
  projects: string[];
  /** Experience / work items */
  experience: string[];
  /** Which question set this profile activates */
  questionSetId: string;
  /** Competency IDs to focus during interview, derived from resume */
  suggestedFocus: string[];
}

// ── Question set ──────────────────────────────────────────────────────────────

export type QuestionSource = 'role' | 'resume_skill' | 'project' | 'adaptive' | 'follow_up';

export interface SetupQuestion {
  id: string;
  source: QuestionSource;
  competencyId: string;
  difficulty: 'foundational' | 'easy' | 'medium' | 'hard' | 'expert';
  question: string;
  expectedConcepts: string[];
}

export interface QuestionSet {
  id: string;
  roleId: string | null;
  resumeProfileId: string | null;
  description: string;
  questions: SetupQuestion[];
}

// ── Final setup object ────────────────────────────────────────────────────────

export interface AssessmentSetup {
  sectorId: string;
  roleId: string;
  level: RoleLevel;
  resumeProfileId: string | null;
  questionSetId: string;
  focusCompetencies: string[];
  duration: AssessmentDuration;
}

// ── Resume scan state ─────────────────────────────────────────────────────────

export type ScanState = 'idle' | 'uploading' | 'scanning' | 'extracting' | 'matching' | 'ready' | 'error';
