/**
 * src/services/facultyService.ts — Phase 4: Faculty Service.
 * Retrieves teaching dashboards, course overviews, and aggregate performance analytics.
 */

import { delay } from '../lib/api';
import { mockFacultyProfiles, type FacultyProfileData } from '../mock/faculty';
import { mockAggregateResults, type AssessmentAggregateResults } from '../mock/studentResults';
import { mockAssessments } from '../mock/assessments';

export class MockFacultyService {
  async getFacultyDashboard(facultyId: string): Promise<FacultyProfileData> {
    await delay(350);
    const profile = mockFacultyProfiles[facultyId] ?? mockFacultyProfiles['faculty-001'];
    
    // Sync with dynamically created assessments
    const currentFacultyAssessments = mockAssessments.filter(
      (a) => a.facultyId === facultyId || a.facultyId === 'faculty-001'
    );

    const mergedRecent = currentFacultyAssessments.map((a) => ({
      id: a.id,
      title: a.title,
      courseCode: 'CS-302',
      documentTitle: a.documentTitle,
      documentId: a.documentId,
      activeStudents: a.completionStats.completed,
      totalEnrolled: a.completionStats.total,
      avgCompletionRate: Math.round((a.completionStats.completed / a.completionStats.total) * 100),
      avgScore: a.completionStats.avgScore,
      createdAt: a.createdAt.slice(0, 10),
      status: a.status,
      topics: a.topics,
    }));

    return {
      ...profile,
      stats: {
        ...profile.stats,
        activeAssessments: currentFacultyAssessments.length,
      },
      recentAssessments: mergedRecent.length > 0 ? mergedRecent : profile.recentAssessments,
    };
  }

  async getAssessmentAnalytics(assessmentId: string): Promise<AssessmentAggregateResults> {
    await delay(300);
    const results = mockAggregateResults[assessmentId];
    if (results) return results;

    // Fallback default aggregate
    return {
      assessmentId,
      assessmentTitle: 'Operating Systems — Midterm Oral Assessment',
      documentTitle: 'Operating Systems — Lecture 04.pdf',
      completionCount: 42,
      totalEnrolled: 50,
      avgScore: 74,
      topicPerformance: [
        { topic: 'Processes', scorePercent: 81, totalAttempts: 126 },
        { topic: 'Threads', scorePercent: 68, totalAttempts: 120 },
        { topic: 'Scheduling', scorePercent: 74, totalAttempts: 135 },
      ],
      commonWeaknesses: [
        'Context switching overhead and PCB state persistence',
        'Thread synchronization with mutexes vs semaphores',
        'Scheduling algorithms edge-case analysis',
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
      ],
    };
  }
}

export const facultyService = new MockFacultyService();
