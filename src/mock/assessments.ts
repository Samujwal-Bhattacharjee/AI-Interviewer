/**
 * src/mock/assessments.ts — Phase 4: Assessments Catalog & Storage.
 * Stores faculty-created assessments, configurations, and student assignments.
 */

export interface FacultyAssessmentConfig {
  id: string;
  title: string;
  description: string;
  facultyId: string;
  facultyName: string;
  documentId?: string;
  documentTitle?: string;
  topics: string[];
  difficulty: 'foundational' | 'easy' | 'medium' | 'hard';
  questionCount: number;
  language: string;
  interviewMode: 'mode1_native' | 'mode2_any_lang' | 'native' | 'any_language';
  assignedStudentIds: string[];
  createdAt: string;
  status: 'active' | 'draft' | 'archived';
  completionStats: {
    completed: number;
    total: number;
    avgScore: number;
  };
}

export const mockAssessments: FacultyAssessmentConfig[] = [
  {
    id: 'faculty-asmt-001',
    title: 'Operating Systems — Midterm Oral Assessment',
    description: 'Oral technical evaluation over process synchronization, thread lifecycles, and CPU scheduling algorithms.',
    facultyId: 'faculty-001',
    facultyName: 'Dr. Priya Sharma',
    documentId: 'doc-001',
    documentTitle: 'Operating Systems — Lecture 04.pdf',
    topics: ['Processes', 'Threads', 'Scheduling'],
    difficulty: 'medium',
    questionCount: 6,
    language: 'en-IN',
    interviewMode: 'native',
    assignedStudentIds: ['student-001', 'student-002'],
    createdAt: '2026-09-24T10:00:00Z',
    status: 'active',
    completionStats: {
      completed: 42,
      total: 50,
      avgScore: 74,
    },
  },
  {
    id: 'faculty-asmt-002',
    title: 'Python Fundamentals & Concurrency',
    description: 'Evaluation of Python runtime internals, GIL implications, and asyncio event loops.',
    facultyId: 'faculty-001',
    facultyName: 'Dr. Priya Sharma',
    documentId: 'doc-003',
    documentTitle: 'Python Systems & Core Mechanics.pdf',
    topics: ['GIL', 'Asyncio', 'Multiprocessing'],
    difficulty: 'medium',
    questionCount: 8,
    language: 'en-IN',
    interviewMode: 'native',
    assignedStudentIds: ['student-001'],
    createdAt: '2026-09-18T14:30:00Z',
    status: 'active',
    completionStats: {
      completed: 42,
      total: 45,
      avgScore: 81,
    },
  },
  {
    id: 'faculty-asmt-003',
    title: 'Database Systems & Query Optimization',
    description: 'Relational algebra, ACID transaction isolation levels, and B-Tree indexing.',
    facultyId: 'faculty-001',
    facultyName: 'Dr. Priya Sharma',
    documentId: 'doc-004',
    documentTitle: 'DBMS Transactions & Indexing.pdf',
    topics: ['Transactions', 'ACID', 'B-Trees'],
    difficulty: 'hard',
    questionCount: 8,
    language: 'en-IN',
    interviewMode: 'native',
    assignedStudentIds: ['student-002'],
    createdAt: '2026-09-15T11:00:00Z',
    status: 'active',
    completionStats: {
      completed: 31,
      total: 40,
      avgScore: 68,
    },
  },
];
