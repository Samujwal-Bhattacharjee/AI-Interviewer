/**
 * src/mock/authUsers.ts — Phase 4: Mock Authentication System.
 * Clean mock data layer for student & faculty credentials and profiles.
 * Designed to be replaced by a real auth provider (e.g. Supabase/FastAPI Auth) later.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty';
  avatarInitials: string;
  title?: string;
}

export const mockAuthUsers: AuthUser[] = [
  {
    id: 'student-001',
    name: 'Arjun Kumar',
    email: 'arjun@example.com',
    role: 'student',
    avatarInitials: 'AK',
    title: 'Computer Science Undergraduate',
  },
  {
    id: 'faculty-001',
    name: 'Dr. Priya Sharma',
    email: 'priya@example.com',
    role: 'faculty',
    avatarInitials: 'PS',
    title: 'Associate Professor, Computer Systems',
  },
  {
    id: 'student-002',
    name: 'Sneha Patel',
    email: 'sneha@example.com',
    role: 'student',
    avatarInitials: 'SP',
    title: 'Software Engineering Major',
  },
  {
    id: 'faculty-002',
    name: 'Prof. Vikram Sen',
    email: 'vikram@example.com',
    role: 'faculty',
    avatarInitials: 'VS',
    title: 'Department Chair, Distributed Computing',
  },
];
