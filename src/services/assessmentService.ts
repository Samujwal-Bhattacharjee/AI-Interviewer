/**
 * assessmentService.ts — Phase 2: Real FastAPI integration.
 *
 * POST /api/sessions           → createSession(config)
 * GET  /api/sessions/{id}      → getSession(id)
 * POST /api/sessions/{id}/start → startInterview(id)
 * GET  /api/sessions/{id}/report → getAssessmentReport(id)
 */

import { apiClient, DATA_MODE, delay } from '../lib/api';
import { mockSession, mockAdaptiveState } from '../mock/assessment';
import type { AssessmentSession, AssessmentConfig, AdaptiveState, AssessmentReport } from '../types/assessment';
import type { EstimatedLevel } from '../types/skills';

/** Maps the backend snake_case session object to the camelCase frontend type. */
function mapSession(raw: Record<string, unknown>): AssessmentSession {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    targetRoleId: raw.target_role_id as string,
    startedAt: raw.started_at as string,
    completedAt: (raw.completed_at as string | null) ?? undefined,
    status: raw.status as AssessmentSession['status'],
    questionCount: raw.question_count as number,
    currentQuestionIndex: raw.current_question_index as number,
    focusCompetencies: (raw.focus_competencies as string[]) ?? [],
    duration: raw.duration as AssessmentSession['duration'],
    interviewMode: (raw.interview_mode as AssessmentSession['interviewMode']) ?? (raw.interviewMode as AssessmentSession['interviewMode']) ?? 'native',
    targetLanguage: (raw.target_language as string) ?? (raw.language as string) ?? 'hi-IN',
    language: (raw.language as string) ?? (raw.target_language as string) ?? 'hi-IN',
    questionLanguage: (raw.question_language as string) ?? (raw.questionLanguage as string) ?? undefined,
    answerLanguage: (raw.answer_language as string) ?? (raw.answerLanguage as string) ?? undefined,
  };
}

import { mockAssessments, type FacultyAssessmentConfig } from '../mock/assessments';
import { mockSkillEstimates } from '../mock/skills';

const activeSessionConfigs = new Map<string, AssessmentConfig>();

export function getActiveSessionConfig(sessionId: string): AssessmentConfig | undefined {
  return activeSessionConfigs.get(sessionId);
}

export function saveFacultyAssessment(config: FacultyAssessmentConfig): void {
  const existingIdx = mockAssessments.findIndex((a) => a.id === config.id);
  if (existingIdx >= 0) {
    mockAssessments[existingIdx] = config;
  } else {
    mockAssessments.unshift(config);
  }
}

export async function createSession(config: AssessmentConfig): Promise<AssessmentSession> {
  const mode = config.interviewMode ?? 'native';
  const lang = config.language ?? config.targetLanguage ?? 'hi-IN';
  const qLang = config.questionLanguage ?? (mode === 'any_language' ? 'en-IN' : lang);
  const aLang = config.answerLanguage ?? (mode === 'any_language' ? 'auto' : lang);

  if (DATA_MODE === 'mock') {
    await delay(500);
    const sessionId = `session-00${Math.floor(Math.random() * 900 + 100)}`;
    activeSessionConfigs.set(sessionId, config);

    return {
      id: sessionId,
      userId: 'user-001',
      targetRoleId: config.targetRoleId,
      startedAt: new Date().toISOString(),
      status: 'pending',
      questionCount: config.duration === 'quick' ? 5 : config.duration === 'standard' ? 10 : 20,
      currentQuestionIndex: 0,
      focusCompetencies: config.focusCompetencies,
      duration: config.duration,
      interviewMode: mode,
      targetLanguage: lang,
      language: lang,
      questionLanguage: qLang,
      answerLanguage: aLang,
      assessmentType: config.assessmentType,
      facultyAssessmentId: config.facultyAssessmentId,
      documentId: config.documentId,
      documentTitle: config.documentTitle,
      topics: config.topics,
    };
  }

  const res = await apiClient.post<Record<string, unknown>>('/api/sessions', {
    user_id: 'user-001', // TODO: replace with real auth user id
    target_role_id: config.targetRoleId,
    level: config.level,
    focus_competencies: config.focusCompetencies,
    duration: config.duration,
    // Backend compatibility: both camelCase and snake_case
    interview_mode: mode,
    interviewMode: mode,
    target_language: lang,
    language: lang,
    questionLanguage: qLang,
    answerLanguage: aLang,
    question_language: qLang,
    answer_language: aLang,
    ...(config.resumeProfileId ? { resume_profile_id: config.resumeProfileId } : {}),
  });

  return mapSession(res.data);
}

export async function getSession(sessionId: string): Promise<AssessmentSession> {
  if (DATA_MODE === 'mock') {
    await delay(300);
    return { ...mockSession, id: sessionId };
  }
  const res = await apiClient.get<Record<string, unknown>>(`/api/sessions/${sessionId}`);
  return mapSession(res.data);
}

export async function startInterview(sessionId: string): Promise<AssessmentSession> {
  if (DATA_MODE === 'mock') {
    await delay(400);
    return { ...mockSession, id: sessionId, status: 'active' };
  }
  // POST /api/sessions/{id}/start returns a StartSessionResponse:
  // { session, first_question, adaptive_state }
  // The first_question is consumed by useInterview.ts via getNextQuestion.
  const res = await apiClient.post<{ session: Record<string, unknown> }>(
    `/api/sessions/${sessionId}/start`
  );
  return mapSession(res.data.session);
}

export async function getAdaptiveState(sessionId: string): Promise<AdaptiveState> {
  if (DATA_MODE === 'mock') {
    await delay(200);
    return { ...mockAdaptiveState };
  }
  const res = await apiClient.get<{
    adaptive_state: {
      current_difficulty: string;
      search_region: { lower: string; upper: string };
      last_action: string | null;
      evidence_analyzed: boolean;
      current_estimate: number;
    };
  }>(`/api/sessions/${sessionId}/current-state`);
  const a = res.data.adaptive_state;
  return {
    currentDifficulty: a.current_difficulty as AdaptiveState['currentDifficulty'],
    searchRegion: {
      lower: a.search_region.lower as AdaptiveState['currentDifficulty'],
      upper: a.search_region.upper as AdaptiveState['currentDifficulty'],
    },
    lastAction: a.last_action as AdaptiveState['lastAction'],
    evidenceAnalyzed: a.evidence_analyzed,
    currentEstimate: a.current_estimate,
  };
}

export async function getAssessmentReport(sessionId: string): Promise<AssessmentReport> {
  if (DATA_MODE === 'mock') {
    await delay(400);
    const cfg = activeSessionConfigs.get(sessionId);
    const isDocAssessment = cfg?.assessmentType === 'faculty_assigned' || !!cfg?.documentTitle;

    if (isDocAssessment) {
      return {
        sessionId,
        completedAt: new Date().toISOString(),
        targetRoleId: cfg?.targetRoleId ?? 'role-001',
        overallScore: 76,
        assessmentType: 'faculty_assigned',
        documentTitle: cfg?.documentTitle ?? 'Operating Systems — Lecture 04.pdf',
        topicsEvaluated: cfg?.topics ?? ['Processes', 'Threads', 'Scheduling'],
        summary:
          'Oral examination completed successfully across document-indexed course material. High demonstrated mastery on Process state lifecycles and CPU scheduling tradeoffs. Targeted review recommended for thread synchronization primitives.',
        questionSources: {
          DOCUMENT: 4,
          'ADAPTIVE FOLLOW-UP': 2,
          TOPIC: 1,
        },
        skillEstimates: [
          { competencyId: 'comp-dsa', score: 82, confidence: 0.88, confidenceLevel: 'high', evidenceCount: 3, estimatedLevel: 'proficient', trend: 'up', updatedAt: new Date().toISOString() },
          { competencyId: 'comp-python', score: 75, confidence: 0.82, confidenceLevel: 'high', evidenceCount: 3, estimatedLevel: 'proficient', trend: 'up', updatedAt: new Date().toISOString() },
          { competencyId: 'comp-debugging', score: 62, confidence: 0.79, confidenceLevel: 'medium', evidenceCount: 2, estimatedLevel: 'developing', trend: 'stable', updatedAt: new Date().toISOString() },
          { competencyId: 'comp-sql', score: 71, confidence: 0.84, confidenceLevel: 'high', evidenceCount: 2, estimatedLevel: 'proficient', trend: 'up', updatedAt: new Date().toISOString() },
        ],
        gapAnalysis: [
          { competencyId: 'comp-debugging', competencyName: 'Thread Synchronization & Mutexes', currentScore: 62, targetScore: 80, gap: -18, priority: 'high' },
          { competencyId: 'comp-python', competencyName: 'CPU Scheduling Algorithms', currentScore: 75, targetScore: 80, gap: -5, priority: 'medium' },
        ],
        evidence: [
          { questionId: 'doc-q-proc-e1', competencyId: 'comp-dsa', concept: 'Process vs Program isolation', status: 'demonstrated', explanation: 'Correctly distinguished passive binary images on disk from active memory execution states with private address spaces.', confidence: 0.9 },
          { questionId: 'doc-q-sched-e1', competencyId: 'comp-python', concept: 'Preemptive vs Non-preemptive scheduling', status: 'demonstrated', explanation: 'Explained timer-driven interrupt preemption and voluntary yielding with accurate latency tradeoff analysis.', confidence: 0.85 },
          { questionId: 'doc-q-sync-m2', competencyId: 'comp-debugging', concept: 'Condition variable predicate loops', status: 'partial', explanation: 'Identified mutex release during sleep but omitted justification for loop-based predicate re-checking under spurious wakeups.', confidence: 0.72 },
        ],
        recommendations: [
          'Review POSIX pthread_cond_wait predicate loop constructs and spurious wakeup hazards.',
          'Practice tracing Multi-Level Feedback Queue priority demotion and aging formulas.',
        ],
        resources: {
          free: [
            { id: 'res-os-1', title: 'OSTEP: Concurrency & Condition Variables', provider: 'Remzi & Andrea Arpaci-Dusseau', skill: 'Synchronization', resourceType: 'Book Chapter', difficulty: 'Intermediate', estimatedDuration: '45 mins', priceType: 'free', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', reason: 'Addresses identified gap in condition variable predicates' },
          ],
          paid: [
            { id: 'res-os-2', title: 'Linux Kernel Development: Schedulers & Synchronization', provider: 'Robert Love', skill: 'OS Internals', resourceType: 'Course', difficulty: 'Advanced', estimatedDuration: '3 hours', priceType: 'paid', url: 'https://example.com/kernel-dev', reason: 'Recommended reading for midterm mastery' },
          ],
          source: 'curated',
        },
      };
    }

    return {
      sessionId,
      completedAt: new Date().toISOString(),
      targetRoleId: cfg?.targetRoleId ?? 'role-001',
      overallScore: 78,
      assessmentType: 'career',
      summary:
        'Assessment complete. Candidate demonstrates robust algorithmic intuition and systematic debugging. Targeted practice advised in concurrency race condition diagnostics.',
      questionSources: {
        ROLE: 3,
        RESUME: 2,
        PROJECT: 2,
        DOCUMENT: 0,
        'ADAPTIVE FOLLOW-UP': 3,
      },
      skillEstimates: mockSkillEstimates,
      gapAnalysis: [
        { competencyId: 'comp-debugging', competencyName: 'Diagnostic Debugging', currentScore: 54, targetScore: 75, gap: -21, priority: 'critical' },
        { competencyId: 'comp-sql', competencyName: 'Relational Data & SQL', currentScore: 63, targetScore: 75, gap: -12, priority: 'high' },
      ],
      recommendations: [
        'Practice asynchronous race condition isolation and deterministic reproduction.',
        'Deepen understanding of SQL execution plan indexing and window aggregates.',
      ],
      evidence: [
        { questionId: 'q-001', competencyId: 'comp-dsa', concept: 'Hash table lookup complexity', status: 'demonstrated', explanation: 'Explained amortized O(1) operations, collision resolution chaining, and load factor resizing.', confidence: 0.92 },
        { questionId: 'q-003', competencyId: 'comp-debugging', concept: 'Intermittent bug isolation', status: 'partial', explanation: 'Detailed log inspection but missed concurrency race condition isolation strategies.', confidence: 0.74 },
      ],
    };
  }

  const res = await apiClient.get<Record<string, unknown>>(`/api/sessions/${sessionId}/report`);
  const d = res.data;
  const skillEstimates = ((d.skill_estimates as Record<string, unknown>[]) ?? []).map((e) => ({
    competencyId: e.competency_id as string,
    score: e.score as number,
    confidence: e.confidence as number,
    confidenceLevel: e.confidence_level as 'low' | 'medium' | 'high',
    evidenceCount: e.evidence_count as number,
    estimatedLevel: (e.estimated_level as EstimatedLevel) ?? 'developing',
    trend: e.trend as 'up' | 'down' | 'stable',
    updatedAt: e.updated_at as string,
  }));

  const gapAnalysis = ((d.gaps as Record<string, unknown>[]) ?? []).map((g) => ({
    competencyId: g.competency_id as string,
    competencyName: g.competency_name as string,
    currentScore: g.current_score as number,
    targetScore: g.target_score as number,
    gap: g.gap as number,
    priority: g.priority as 'critical' | 'high' | 'medium' | 'low',
  }));

  const evidence = ((d.evidence as Record<string, unknown>[]) ?? []).map((ev) => ({
    questionId: ev.question_id as string,
    competencyId: ev.competency_id as string,
    concept: ev.concept as string,
    status: ev.status as 'demonstrated' | 'partial' | 'missing',
    explanation: ev.explanation as string,
    confidence: ev.confidence as number,
  }));

  // Map course resources if present
  type RawResource = Record<string, unknown>;
  const mapResource = (r: RawResource) => ({
    id: r.id as string,
    title: r.title as string,
    provider: r.provider as string,
    skill: r.skill as string,
    resourceType: r.resource_type as string,
    difficulty: r.difficulty as string,
    estimatedDuration: r.estimated_duration as string,
    priceType: r.price_type as 'free' | 'paid',
    url: r.url as string,
    reason: r.reason as string,
    priority: r.priority as string | undefined,
    forCompetency: r.for_competency as string | undefined,
  });

  const rawResources = d.resources as Record<string, unknown> | undefined;
  const resources = rawResources
    ? {
        free: ((rawResources.free as RawResource[]) ?? []).map(mapResource),
        paid: ((rawResources.paid as RawResource[]) ?? []).map(mapResource),
        source: (rawResources.source as string) ?? 'curated',
      }
    : undefined;

  return {
    sessionId: d.session_id as string,
    completedAt: d.completed_at as string,
    targetRoleId: d.target_role_id as string,
    overallScore: d.overall_score as number,
    summary: d.summary as string,
    skillEstimates,
    gapAnalysis,
    evidence,
    recommendations: (d.recommendations as string[]) ?? [],
    resources,
  };
}
