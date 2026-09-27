/**
 * src/mock/studentResults.ts — Phase 4: Faculty Aggregate Results & Analytics.
 */

export interface TopicPerformanceStat {
  topic: string;
  scorePercent: number;
  totalAttempts: number;
}

export interface StudentResultSummary {
  studentId: string;
  studentName: string;
  score: number;
  status: 'completed' | 'in_progress' | 'pending';
  completedAt?: string;
  topStrength: string;
  primaryGap: string;
}

export interface AssessmentAggregateResults {
  assessmentId: string;
  assessmentTitle: string;
  documentTitle: string;
  completionCount: number;
  totalEnrolled: number;
  avgScore: number;
  topicPerformance: TopicPerformanceStat[];
  commonWeaknesses: string[];
  studentResults: StudentResultSummary[];
}

export const mockAggregateResults: Record<string, AssessmentAggregateResults> = {
  'faculty-asmt-001': {
    assessmentId: 'faculty-asmt-001',
    assessmentTitle: 'Operating Systems — Midterm Oral Assessment',
    documentTitle: 'Operating Systems — Lecture 04.pdf',
    completionCount: 42,
    totalEnrolled: 50,
    avgScore: 74,
    topicPerformance: [
      { topic: 'Processes', scorePercent: 81, totalAttempts: 126 },
      { topic: 'Threads', scorePercent: 68, totalAttempts: 120 },
      { topic: 'Scheduling', scorePercent: 74, totalAttempts: 135 },
      { topic: 'Synchronization', scorePercent: 62, totalAttempts: 98 },
      { topic: 'Memory', scorePercent: 79, totalAttempts: 110 },
    ],
    commonWeaknesses: [
      'Context switching overhead and PCB register state persistence',
      'Thread synchronization with mutexes vs condition variables',
      'Multilevel feedback queue starvation mitigation and aging formulas',
    ],
    studentResults: [
      {
        studentId: 'student-001',
        studentName: 'Arjun Kumar',
        score: 78,
        status: 'completed',
        completedAt: '2026-09-25 16:30',
        topStrength: 'Processes & State Machine',
        primaryGap: 'Thread Synchronization & Condition Variables',
      },
      {
        studentId: 'student-002',
        studentName: 'Sneha Patel',
        score: 86,
        status: 'completed',
        completedAt: '2026-09-25 14:10',
        topStrength: 'CPU Scheduling & CFS Internals',
        primaryGap: 'Hardware Cache Line False Sharing',
      },
      {
        studentId: 'student-003',
        studentName: 'Rohan Mehta',
        score: 64,
        status: 'completed',
        completedAt: '2026-09-24 18:45',
        topStrength: 'Process PCB Concepts',
        primaryGap: 'Context Switching & Register Saving',
      },
      {
        studentId: 'student-004',
        studentName: 'Ananya Roy',
        score: 72,
        status: 'completed',
        completedAt: '2026-09-25 11:20',
        topStrength: 'Round Robin Scheduling',
        primaryGap: 'Deadlock Banker Algorithm Matrices',
      },
    ],
  },
};
