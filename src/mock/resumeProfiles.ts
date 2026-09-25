/**
 * src/mock/resumeProfiles.ts — Predefined candidate profiles for the MVP resume upload flow.
 *
 * IMPORTANT: No OCR is performed. Filename → profile matching only.
 *
 * The four uploaded PDFs map to these exact profiles.
 */

import type { ResumeProfile } from '../types/setup';

export const RESUME_PROFILES: ResumeProfile[] = [
  {
    id: 'resume_profile_01_ml_robotics',
    fileName: 'gcnbfnxkcwby.pdf',
    candidateName: 'Carl Johnson',
    profileTitle: 'Machine Learning / Robotics Engineer',
    skills: ['C', 'C++', 'Java', 'JavaScript', 'Python', 'Prolog', 'Machine Learning', 'Robotics'],
    projects: ['Predictive ML Systems', 'Robotic Tyrion', 'Unicorn Laser Systems'],
    experience: ['Robotics Engineering', 'Machine Learning Research', 'Predictive System Design'],
    questionSetId: 'qs_ml_robotics',
    suggestedFocus: ['comp-dsa', 'comp-python', 'comp-system-design'],
  },
  {
    id: 'resume_profile_02_software',
    fileName: 'Jon Doe – - sdmvdsgzxpwy.pdf',
    candidateName: 'Jon Doe',
    profileTitle: 'Computer Science / Software Engineering',
    skills: ['Java', 'Python', 'C#', 'Unity', 'Google VR SDK', 'Computer Science', 'Robotics'],
    projects: ['Trivia Game', 'Virtual Piano', 'Python Robot Programming'],
    experience: ['Robotics Club', 'Game Development', 'VR Applications'],
    questionSetId: 'qs_software_engineering',
    suggestedFocus: ['comp-dsa', 'comp-debugging', 'comp-python'],
  },
  {
    id: 'resume_profile_03_fullstack',
    fileName: 'kfrvqywfkwjs.pdf',
    candidateName: 'Jane Doe',
    profileTitle: 'Full Stack Web Developer',
    skills: [
      'JavaScript', 'PHP', 'Java', 'HTML', 'CSS',
      'React', 'Angular', 'Express', 'Node.js',
      'MongoDB', 'PostgreSQL', 'REST APIs', 'MVC',
    ],
    projects: ['React/Redux/PHP/MySQL Website', 'Node.js/Express REST API'],
    experience: ['Full Stack Development', 'REST API Design', 'Database Engineering'],
    questionSetId: 'qs_fullstack_web',
    suggestedFocus: ['comp-debugging', 'comp-sql', 'comp-system-design'],
  },
  {
    id: 'resume_profile_04_backend',
    fileName: 'syzfjbzwjncs.pdf',
    candidateName: 'Jake Ryan',
    profileTitle: 'Full Stack / Backend / Data-Oriented Software Engineer',
    skills: [
      'Java', 'Python', 'C/C++', 'SQL/PostgreSQL',
      'JavaScript', 'React', 'FastAPI', 'Flask',
      'Docker', 'Git', 'Redis', 'Celery',
    ],
    projects: ['Gitlytics', 'Simple Paintball'],
    experience: ['REST APIs', 'FastAPI / PostgreSQL Integration', 'Async Task Systems', 'GitHub Data Engineering'],
    questionSetId: 'qs_backend_full_stack',
    suggestedFocus: ['comp-python', 'comp-sql', 'comp-debugging', 'comp-system-design'],
  },
];

/**
 * Returns the ResumeProfile matching the given filename, or null if no match.
 * Matching is exact (case-sensitive) on file name.
 */
export function matchResumeFile(fileName: string): ResumeProfile | null {
  return RESUME_PROFILES.find((p) => p.fileName === fileName) ?? null;
}

export function getResumeProfile(profileId: string): ResumeProfile | null {
  return RESUME_PROFILES.find((p) => p.id === profileId) ?? null;
}
