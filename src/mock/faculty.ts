/**
 * src/mock/faculty.ts — Phase 4: Faculty Dashboard Mock Data.
 * Derives teaching stats, assessments, and aggregate performance metrics by faculty ID.
 */

export interface FacultyAssessmentOverview {
  id: string;
  title: string;
  courseCode: string;
  documentTitle?: string;
  documentId?: string;
  activeStudents: number;
  totalEnrolled: number;
  avgCompletionRate: number;
  avgScore: number;
  createdAt: string;
  status: 'active' | 'draft' | 'archived';
  topics: string[];
}

export interface FacultyStats {
  activeAssessments: number;
  totalStudents: number;
  uploadedDocuments: number;
  avgCompletionRate: string;
}

export interface FacultyProfileData {
  id: string;
  name: string;
  title: string;
  email: string;
  department: string;
  stats: FacultyStats;
  recentAssessments: FacultyAssessmentOverview[];
}

export const mockFacultyProfiles: Record<string, FacultyProfileData> = {
  'faculty-001': {
    id: 'faculty-001',
    name: 'Dr. Priya Sharma',
    title: 'Associate Professor',
    email: 'priya@example.com',
    department: 'Department of Computer Science & Systems Engineering',
    stats: {
      activeAssessments: 3,
      totalStudents: 84,
      uploadedDocuments: 12,
      avgCompletionRate: '76%',
    },
    recentAssessments: [
      {
        id: 'faculty-asmt-001',
        title: 'Operating Systems — Midterm Oral Assessment',
        courseCode: 'CS-302',
        documentTitle: 'Operating Systems — Lecture 04.pdf',
        documentId: 'doc-001',
        activeStudents: 42,
        totalEnrolled: 50,
        avgCompletionRate: 84,
        avgScore: 74,
        createdAt: '2026-09-24',
        status: 'active',
        topics: ['Processes', 'Threads', 'Scheduling'],
      },
      {
        id: 'faculty-asmt-002',
        title: 'Python Fundamentals & Concurrency',
        courseCode: 'CS-201',
        documentTitle: 'Python Systems & Core Mechanics.pdf',
        documentId: 'doc-003',
        activeStudents: 42,
        totalEnrolled: 45,
        avgCompletionRate: 91,
        avgScore: 81,
        createdAt: '2026-09-18',
        status: 'active',
        topics: ['GIL', 'Asyncio', 'Multiprocessing'],
      },
      {
        id: 'faculty-asmt-003',
        title: 'Database Systems & Query Optimization',
        courseCode: 'CS-304',
        documentTitle: 'DBMS Transactions & Indexing.pdf',
        documentId: 'doc-004',
        activeStudents: 31,
        totalEnrolled: 40,
        avgCompletionRate: 77,
        avgScore: 68,
        createdAt: '2026-09-15',
        status: 'active',
        topics: ['Transactions', 'ACID', 'B-Trees', 'SQL Execution Plans'],
      },
    ],
  },
  'faculty-002': {
    id: 'faculty-002',
    name: 'Prof. Vikram Sen',
    title: 'Department Chair & Professor',
    email: 'vikram@example.com',
    department: 'Distributed Systems & Network Architecture',
    stats: {
      activeAssessments: 2,
      totalStudents: 62,
      uploadedDocuments: 8,
      avgCompletionRate: '82%',
    },
    recentAssessments: [
      {
        id: 'faculty-asmt-004',
        title: 'Distributed Consensus & Raft Protocol',
        courseCode: 'CS-501',
        documentTitle: 'Distributed Systems — Consensus & Raft.pptx',
        documentId: 'doc-002',
        activeStudents: 28,
        totalEnrolled: 32,
        avgCompletionRate: 88,
        avgScore: 79,
        createdAt: '2026-09-20',
        status: 'active',
        topics: ['Consensus', 'Leader Election', 'Log Replication'],
      },
    ],
  },
};
