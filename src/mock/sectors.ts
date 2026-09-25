/**
 * src/mock/sectors.ts — Sector → Role catalog for the assessment setup flow.
 *
 * 5 sectors × 3 roles = 15 roles total.
 * Each role has competencyIds that map to the backend question bank.
 */

import type { Sector } from '../types/setup';

export const SECTORS: Sector[] = [
  {
    id: 'technology',
    label: 'Technology',
    roles: [
      {
        id: 'role-sw-engineer',
        title: 'Software Engineer',
        competencyIds: ['comp-dsa', 'comp-python', 'comp-debugging', 'comp-sql', 'comp-system-design'],
        technologies: ['Python', 'Java', 'SQL', 'REST APIs', 'Git'],
        targetLevels: {
          'comp-dsa': 72,
          'comp-python': 78,
          'comp-debugging': 70,
          'comp-sql': 65,
          'comp-system-design': 68,
        },
      },
      {
        id: 'role-data-engineer',
        title: 'Data Engineer',
        competencyIds: ['comp-sql', 'comp-python', 'comp-system-design', 'comp-dsa'],
        technologies: ['Python', 'SQL', 'Spark', 'Airflow', 'dbt'],
        targetLevels: {
          'comp-sql': 82,
          'comp-python': 75,
          'comp-system-design': 70,
          'comp-dsa': 60,
        },
      },
      {
        id: 'role-ml-engineer',
        title: 'ML Engineer',
        competencyIds: ['comp-python', 'comp-dsa', 'comp-system-design', 'comp-debugging'],
        technologies: ['Python', 'PyTorch', 'Scikit-learn', 'MLflow', 'Docker'],
        targetLevels: {
          'comp-python': 82,
          'comp-dsa': 75,
          'comp-system-design': 72,
          'comp-debugging': 68,
        },
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    roles: [
      {
        id: 'role-financial-analyst',
        title: 'Financial Analyst',
        competencyIds: ['comp-sql', 'comp-python', 'comp-dsa'],
        technologies: ['Excel', 'Python', 'SQL', 'Bloomberg', 'Tableau'],
        targetLevels: {
          'comp-sql': 70,
          'comp-python': 60,
          'comp-dsa': 55,
        },
      },
      {
        id: 'role-ib-analyst',
        title: 'Investment Banking Analyst',
        competencyIds: ['comp-sql', 'comp-python', 'comp-system-design'],
        technologies: ['Excel', 'VBA', 'Bloomberg', 'PowerPoint', 'Python'],
        targetLevels: {
          'comp-sql': 65,
          'comp-python': 55,
          'comp-system-design': 58,
        },
      },
      {
        id: 'role-risk-analyst',
        title: 'Risk Analyst',
        competencyIds: ['comp-sql', 'comp-python', 'comp-dsa', 'comp-debugging'],
        technologies: ['Python', 'R', 'SQL', 'SAS', 'Excel'],
        targetLevels: {
          'comp-sql': 72,
          'comp-python': 65,
          'comp-dsa': 60,
          'comp-debugging': 62,
        },
      },
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    roles: [
      {
        id: 'role-health-data-analyst',
        title: 'Healthcare Data Analyst',
        competencyIds: ['comp-sql', 'comp-python', 'comp-dsa'],
        technologies: ['Python', 'SQL', 'R', 'Tableau', 'FHIR'],
        targetLevels: {
          'comp-sql': 75,
          'comp-python': 65,
          'comp-dsa': 60,
        },
      },
      {
        id: 'role-clinical-research',
        title: 'Clinical Research Associate',
        competencyIds: ['comp-sql', 'comp-python', 'comp-debugging'],
        technologies: ['REDCap', 'SAS', 'Excel', 'SPSS', 'SQL'],
        targetLevels: {
          'comp-sql': 68,
          'comp-python': 58,
          'comp-debugging': 65,
        },
      },
      {
        id: 'role-health-informatics',
        title: 'Health Informatics Specialist',
        competencyIds: ['comp-sql', 'comp-system-design', 'comp-debugging', 'comp-python'],
        technologies: ['HL7', 'FHIR', 'SQL', 'Python', 'EHR Systems'],
        targetLevels: {
          'comp-sql': 78,
          'comp-system-design': 70,
          'comp-debugging': 68,
          'comp-python': 62,
        },
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Sales',
    roles: [
      {
        id: 'role-digital-marketing',
        title: 'Digital Marketing Specialist',
        competencyIds: ['comp-sql', 'comp-python', 'comp-dsa'],
        technologies: ['Google Analytics', 'Meta Ads', 'HubSpot', 'SQL', 'Python'],
        targetLevels: {
          'comp-sql': 62,
          'comp-python': 55,
          'comp-dsa': 50,
        },
      },
      {
        id: 'role-growth-marketing',
        title: 'Growth Marketing Manager',
        competencyIds: ['comp-sql', 'comp-python', 'comp-system-design'],
        technologies: ['Mixpanel', 'Amplitude', 'SQL', 'Python', 'A/B Testing'],
        targetLevels: {
          'comp-sql': 70,
          'comp-python': 60,
          'comp-system-design': 62,
        },
      },
      {
        id: 'role-sdr',
        title: 'Sales Development Representative',
        competencyIds: ['comp-sql', 'comp-python', 'comp-debugging'],
        technologies: ['Salesforce', 'HubSpot', 'SQL', 'Excel', 'Outreach'],
        targetLevels: {
          'comp-sql': 55,
          'comp-python': 45,
          'comp-debugging': 50,
        },
      },
    ],
  },
  {
    id: 'design',
    label: 'Design & Product',
    roles: [
      {
        id: 'role-product-designer',
        title: 'Product Designer',
        competencyIds: ['comp-debugging', 'comp-system-design', 'comp-sql'],
        technologies: ['Figma', 'Framer', 'Prototyping', 'User Testing', 'Sketch'],
        targetLevels: {
          'comp-debugging': 60,
          'comp-system-design': 65,
          'comp-sql': 50,
        },
      },
      {
        id: 'role-ux-designer',
        title: 'UX Designer',
        competencyIds: ['comp-debugging', 'comp-system-design', 'comp-python'],
        technologies: ['Figma', 'Miro', 'UserZoom', 'Maze', 'HTML/CSS'],
        targetLevels: {
          'comp-debugging': 62,
          'comp-system-design': 60,
          'comp-python': 48,
        },
      },
      {
        id: 'role-product-manager',
        title: 'Product Manager',
        competencyIds: ['comp-sql', 'comp-system-design', 'comp-dsa', 'comp-python'],
        technologies: ['JIRA', 'SQL', 'Figma', 'Analytics', 'Roadmapping'],
        targetLevels: {
          'comp-sql': 68,
          'comp-system-design': 72,
          'comp-dsa': 58,
          'comp-python': 55,
        },
      },
    ],
  },
];

// Competency display names
export const COMPETENCY_NAMES: Record<string, string> = {
  'comp-dsa': 'Algorithms & DS',
  'comp-python': 'Python Systems',
  'comp-sql': 'Databases & SQL',
  'comp-debugging': 'Debugging',
  'comp-system-design': 'System Design',
};

export function getSectorById(sectorId: string): Sector | null {
  return SECTORS.find((s) => s.id === sectorId) ?? null;
}
