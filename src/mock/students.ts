/**
 * src/mock/students.ts — Phase 4: Student Dashboard Mock Data.
 * Derives profile, skill estimates, trajectory, and assigned faculty assessments by student ID.
 */

export interface StudentSkillSnapshot {
  name: string;
  key: string;
  score: number;
}

export interface StudentAssessmentRecord {
  id: string;
  role: string;
  date: string;
  status: string;
  score: number;
  assessmentType: 'career' | 'faculty_assigned';
}

export interface StudentTrajectory {
  competency: string;
  history: number[];
}

export interface StudentAssignedAssessment {
  id: string;
  title: string;
  facultyName: string;
  facultyId: string;
  documentId: string;
  documentTitle: string;
  topics: string[];
  durationMinutes: number;
  status: 'pending' | 'completed' | 'in_progress';
  dueDate: string;
  difficulty: 'foundational' | 'easy' | 'medium' | 'hard';
}

export interface StudentResourceRecommendation {
  title: string;
  type: 'free' | 'paid';
  provider: string;
  url: string;
  reason: string;
}

export interface StudentProfileData {
  id: string;
  name: string;
  email: string;
  targetRole: string;
  targetRoleId: string;
  currentLevel: string;
  skillSnapshot: StudentSkillSnapshot[];
  nextAction: {
    competency: string;
    message: string;
    actionType: 'assessment' | 'review';
  };
  assessmentHistory: StudentAssessmentRecord[];
  skillTrajectory: StudentTrajectory[];
  assignedAssessments: StudentAssignedAssessment[];
  recommendedResources: StudentResourceRecommendation[];
}

export const mockStudentProfiles: Record<string, StudentProfileData> = {
  'student-001': {
    id: 'student-001',
    name: 'Arjun Kumar',
    email: 'arjun@example.com',
    targetRole: 'Software Engineer',
    targetRoleId: 'role-001',
    currentLevel: 'INTERMEDIATE',
    skillSnapshot: [
      { name: 'DSA', key: 'dsa', score: 78 },
      { name: 'PYTHON', key: 'python', score: 71 },
      { name: 'DEBUGGING', key: 'debugging', score: 54 },
      { name: 'SQL', key: 'sql', score: 63 },
    ],
    nextAction: {
      competency: 'DEBUGGING',
      message: 'Targeted reassessment recommended',
      actionType: 'assessment',
    },
    assessmentHistory: [
      {
        id: 'hist-001',
        role: 'Software Engineer',
        date: '09/26',
        status: 'Score / skill profile updated',
        score: 78,
        assessmentType: 'career',
      },
      {
        id: 'hist-002',
        role: 'Backend Engineer',
        date: '09/12',
        status: 'Completed',
        score: 72,
        assessmentType: 'career',
      },
    ],
    skillTrajectory: [
      { competency: 'Debugging', history: [44, 52, 61] },
      { competency: 'DSA', history: [65, 72, 78] },
      { competency: 'Python', history: [58, 65, 71] },
    ],
    assignedAssessments: [
      {
        id: 'faculty-asmt-001',
        title: 'Operating Systems — Midterm Oral Assessment',
        facultyName: 'Dr. Priya Sharma',
        facultyId: 'faculty-001',
        documentId: 'doc-001',
        documentTitle: 'Operating Systems — Lecture 04.pdf',
        topics: ['Processes', 'Threads', 'Scheduling'],
        durationMinutes: 15,
        status: 'pending',
        dueDate: 'Tomorrow, 5:00 PM',
        difficulty: 'medium',
      },
    ],
    recommendedResources: [
      {
        title: 'Diagnostic Debugging & Race Condition Tracing',
        type: 'free',
        provider: 'Systems Engineering Manual',
        url: 'https://docs.python.org/3/library/pdb.html',
        reason: 'Targeted for 54 score in Debugging',
      },
      {
        title: 'Distributed Systems & Concurrency Deep Dive',
        type: 'paid',
        provider: 'Systems Academy',
        url: 'https://example.com/systems',
        reason: 'Recommended for Midterm Assessment preparation',
      },
    ],
  },
  'student-002': {
    id: 'student-002',
    name: 'Sneha Patel',
    email: 'sneha@example.com',
    targetRole: 'Full Stack Engineer',
    targetRoleId: 'role-002',
    currentLevel: 'ADVANCED',
    skillSnapshot: [
      { name: 'DSA', key: 'dsa', score: 85 },
      { name: 'PYTHON', key: 'python', score: 89 },
      { name: 'DEBUGGING', key: 'debugging', score: 76 },
      { name: 'SQL', key: 'sql', score: 82 },
    ],
    nextAction: {
      competency: 'SYSTEM DESIGN',
      message: 'Oral architectural calibration recommended',
      actionType: 'assessment',
    },
    assessmentHistory: [
      {
        id: 'hist-003',
        role: 'Full Stack Engineer',
        date: '09/25',
        status: 'Passed with Distinction',
        score: 88,
        assessmentType: 'career',
      },
    ],
    skillTrajectory: [
      { competency: 'System Design', history: [62, 75, 84] },
      { competency: 'Python', history: [74, 82, 89] },
    ],
    assignedAssessments: [
      {
        id: 'faculty-asmt-001',
        title: 'Operating Systems — Midterm Oral Assessment',
        facultyName: 'Dr. Priya Sharma',
        facultyId: 'faculty-001',
        documentId: 'doc-001',
        documentTitle: 'Operating Systems — Lecture 04.pdf',
        topics: ['Processes', 'Threads', 'Scheduling'],
        durationMinutes: 15,
        status: 'pending',
        dueDate: 'Tomorrow, 5:00 PM',
        difficulty: 'medium',
      },
    ],
    recommendedResources: [
      {
        title: 'Linux Kernel Process Scheduling internals',
        type: 'free',
        provider: 'Kernel.org Documentation',
        url: 'https://www.kernel.org/doc/html/latest/scheduler/index.html',
        reason: 'Advanced OS calibration study',
      },
    ],
  },
};
