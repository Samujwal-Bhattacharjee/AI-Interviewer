/**
 * src/services/studentService.ts — Phase 4: Student Service.
 * Retrieves student profile data, skill snapshots, and assigned assessments.
 */

import { delay } from '../lib/api';
import { mockStudentProfiles, type StudentProfileData, type StudentAssignedAssessment } from '../mock/students';
import { mockAssessments } from '../mock/assessments';

export class MockStudentService {
  async getStudentDashboard(studentId: string): Promise<StudentProfileData> {
    await delay(350);
    const profile = mockStudentProfiles[studentId] ?? mockStudentProfiles['student-001'];
    
    // Dynamically merge any faculty assessments assigned to this student
    const assignedFromAssessments: StudentAssignedAssessment[] = mockAssessments
      .filter((a) => a.assignedStudentIds.includes(studentId) || a.assignedStudentIds.includes('student-001'))
      .map((a) => ({
        id: a.id,
        title: a.title,
        facultyName: a.facultyName,
        facultyId: a.facultyId,
        documentId: a.documentId ?? 'doc-001',
        documentTitle: a.documentTitle ?? 'Course Material.pdf',
        topics: a.topics,
        durationMinutes: a.questionCount * 2.5,
        status: 'pending',
        dueDate: 'Tomorrow, 5:00 PM',
        difficulty: a.difficulty,
      }));

    // Avoid duplicate IDs
    const existingIds = new Set(profile.assignedAssessments.map((a) => a.id));
    const combinedAssigned = [
      ...profile.assignedAssessments,
      ...assignedFromAssessments.filter((a) => !existingIds.has(a.id)),
    ];

    return {
      ...profile,
      assignedAssessments: combinedAssigned,
    };
  }

  async getStudentAssignedAssessments(studentId: string): Promise<StudentAssignedAssessment[]> {
    const dashboard = await this.getStudentDashboard(studentId);
    return dashboard.assignedAssessments;
  }
}

export const studentService = new MockStudentService();
