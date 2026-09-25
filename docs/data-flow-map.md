# Data Flow Map — Phase 2 Audit

> Every value displayed in the ADAPTIVE UI is listed here.
> Current source = mock. Future source = FastAPI / PostgreSQL / Graphiti.

---

## Page: `/` (Landing Page)

| Displayed Value | Component | Current Source | Future API | Backend Entity | DB Table | Graphiti | Real-time |
|---|---|---|---|---|---|---|---|
| Skill bars (DSA=78, Python=71, etc.) | `LandingPage` inline `mockSkillDisplay` | HARDCODED in component | `GET /api/users/{id}/skills` | `SkillEstimate` | `skill_estimates` | `skill_history` nodes | No (static preview) |
| Target scores (72, 74, 68, 74, 55) | `LandingPage` inline `mockSkillDisplay` | HARDCODED in component | `GET /api/roles/{id}` | `CompetencyRequirement` | `role_competencies` | No | No |
| Confidence values (0.89, 0.84) | `LandingPage` inline `mockSkillDisplay` | HARDCODED in component | `GET /api/users/{id}/skills` | `SkillEstimate.confidence` | `skill_estimates` | No | No |
| QUESTION: 04 / 10 | `LandingPage` annotations section | HARDCODED string | `GET /api/sessions/{id}` | `AssessmentSession` | `assessment_sessions` | No | No |
| DIFFICULTY: HARD | `LandingPage` annotations section | HARDCODED string | `GET /api/sessions/{id}/current-state` | `AdaptiveState` | `assessment_sessions` | No | No |
| SEARCHING: MED to HARD | `LandingPage` annotations section | HARDCODED string | `GET /api/sessions/{id}/current-state` | `AdaptiveState` | `assessment_sessions` | No | No |
| ESTIMATE: 72 | `LandingPage` annotations section | HARDCODED string | `GET /api/sessions/{id}/current-state` | `AdaptiveState` | `assessment_sessions` | No | No |
| "Junior Software Engineer" (label) | `LandingPage` skill preview section | HARDCODED string | `GET /api/roles/{id}` | `TargetRole.title` | `roles` | No | No |
| "Session 03" | `LandingPage` skill preview section | HARDCODED string | `GET /api/users/{id}/stats` | `AssessmentSession` count | `assessment_sessions` | No | No |

---

## Page: `/assess` (Assessment Configuration)

| Displayed Value | Component | Current Source | Future API | Backend Entity | DB Table | Graphiti | Real-time |
|---|---|---|---|---|---|---|---|
| Role cards (titles, levels, technologies) | `AssessmentPage` | `mock/roles.ts` via `roleService` | `GET /api/roles` | `TargetRole[]` | `roles` | No | No |
| Competency pills (DSA, Python) | `AssessmentPage` | `selectedRole.competencies` from mock | `GET /api/roles/{id}` | `Competency[]` | `competencies` | No | No |
| Target level bars (72, 74, 68) | `AssessmentPage` competency preview | `selectedRole.requirements[].targetLevel` from mock | `GET /api/roles/{id}` | `CompetencyRequirement.targetLevel` | `role_competencies` | No | No |
| Importance badges (critical, high) | `AssessmentPage` competency preview | `selectedRole.requirements[].importance` from mock | `GET /api/roles/{id}` | `CompetencyRequirement.importance` | `role_competencies` | No | No |
| Session ID (created on Begin) | `AssessmentPage` via `interviewStore` | `assessmentService.createSession()` mock | `POST /api/sessions` | `AssessmentSession.id` | `assessment_sessions` | No | No |

---

## Page: `/interview` (Live Interview)

| Displayed Value | Component | Current Source | Future API | Backend Entity | DB Table | Graphiti | Real-time |
|---|---|---|---|---|---|---|---|
| Session ID display | `InterviewPage` left sidebar | `interviewStore.sessionId` (from mock) | `POST /api/sessions` response | `AssessmentSession.id` | `assessment_sessions` | No | No |
| Target Role title | `InterviewPage` left sidebar | `mockRoles.find(...)` USES MOCK DIRECTLY | `GET /api/roles/{id}` | `TargetRole.title` | `roles` | No | No |
| Question counter (04 / 10) | `InterviewPage` left sidebar | `interviewStore.questionIndex / totalQuestions` | `GET /api/sessions/{id}/current-state` | `AssessmentSession` | `assessment_sessions` | No | WebSocket `question.started` |
| Competency name (DEBUGGING) | `InterviewPage` left sidebar | `competencyNameMap[...]` HARDCODED MAP | `POST /api/sessions/{id}/next-question` response | `InterviewQuestion.competency.name` | `competencies` | No | WebSocket `question.started` |
| Difficulty badge (HARD) | `InterviewPage` sidebar + center | `currentQuestion.difficulty` from mock | `POST /api/sessions/{id}/next-question` | `InterviewQuestion.difficulty` | `questions` | No | WebSocket `difficulty.changed` |
| Question type | `InterviewPage` left sidebar | `currentQuestion.questionType` from mock | `POST /api/sessions/{id}/next-question` | `InterviewQuestion.questionType` | `questions` | No | No |
| Adaptive state (difficulty, search region) | `AdaptiveStatePanel` | `mockAdaptiveState` initial store state | `GET /api/sessions/{id}/current-state` | `AdaptiveState` | `assessment_sessions` | No | WebSocket `interview.state.changed` |
| Current question text | `InterviewPage` center | `mockQuestions[idx]` via `interviewService` | `POST /api/sessions/{id}/next-question` | `InterviewQuestion.question` | `questions` | No | WebSocket `question.started` |
| Expected concepts (evaluating phase) | `InterviewPage` center | `currentQuestion.expectedConcepts` from mock | included in question response | `InterviewQuestion.expectedConcepts` | `questions` | No | No |
| Voice state indicator | `VoiceOrb` | `interviewStore.voiceState` (simulated setTimeout) | WebSocket: `audio.listening`, `audio.transcribing`, `answer.evaluating` | N/A | N/A | No | YES - WebSocket |
| Transcript preview | `InterviewPage` center | HARDCODED mock transcript string in `useInterview.ts` | STT result from audio pipeline | N/A | N/A | No | YES - streaming |
| Skill estimates (score, confidence) | `LiveEstimatePanel` | `mockSkillEstimates` initial store state | WebSocket `skill.updated` event | `SkillEstimate` | `skill_estimates` | `skill_history` | YES - WebSocket |
| Target score in estimate panel | `LiveEstimatePanel` | `mockRoles[0].requirements` hardcoded fallback | `GET /api/roles/{id}` requirements | `CompetencyRequirement.targetLevel` | `role_competencies` | No | No |
| Progress bar percentage | `InterviewPage` | `questionIndex / totalQuestions * 100` | `GET /api/sessions/{id}` | `AssessmentSession` | `assessment_sessions` | No | No |

---

## Page: `/report` (Assessment Report)

| Displayed Value | Component | Current Source | Future API | Backend Entity | DB Table | Graphiti | Real-time |
|---|---|---|---|---|---|---|---|
| ALL DATA | `ReportPage` (shell) | NOT IMPLEMENTED - placeholder only | `GET /api/sessions/{id}/report` | `AssessmentReport` | multiple | evidence nodes | No |
| Summary text | - | - | `report.summary` | `AssessmentReport.summary` | derived | Graphiti context | No |
| Skill scores | - | - | `report.skill_estimates[]` | `SkillEstimate` | `skill_estimates` | No | No |
| Gap analysis | - | - | `report.gaps[]` | `GapAnalysis` | computed | No | No |
| Evidence list | - | - | `report.evidence[]` | `AnswerEvidence` | `answer_evidence` | evidence nodes | No |
| Recommendations | - | - | `report.recommendations[]` | generated | `improvement_tasks` | Graphiti context | No |
| Overall score | - | - | `report.overallScore` | computed | derived | No | No |

---

## Page: `/skills` (Skill Profile)

| Displayed Value | Component | Current Source | Future API | Backend Entity | DB Table | Graphiti | Real-time |
|---|---|---|---|---|---|---|---|
| "Skill Profile / User-001" label | `SkillsPage` | HARDCODED string | current authenticated user | `UserProfile.id` | `users` | No | No |
| "Sessions Completed: 3" | `SkillsPage` | HARDCODED string | `GET /api/users/{id}/stats` | `AssessmentSession` count | `assessment_sessions` | No | No |
| Target Role title | `SkillsPage` | `mockRoles[0]` HARDCODED to first role | `GET /api/users/{id}` then `GET /api/roles/{id}` | `TargetRole.title` | `roles` | No | No |
| Competency scores (78, 71, 63) | `SkillsPage` | `mockSkillEstimates` via `skillService` | `GET /api/users/{id}/skills` | `SkillEstimate.score` | `skill_estimates` | No | No |
| Estimated level (proficient, developing) | `SkillsPage` | `mockSkillEstimates` | `GET /api/users/{id}/skills` | `SkillEstimate.estimatedLevel` | `skill_estimates` | No | No |
| Confidence values | `SkillsPage` | `mockSkillEstimates` | `GET /api/users/{id}/skills` | `SkillEstimate.confidence` | `skill_estimates` | No | No |
| Trend indicators (up down stable) | `SkillsPage` | `mockSkillEstimates` | `GET /api/users/{id}/skills` | `SkillEstimate.trend` | `skill_estimates` | Graphiti history | No |
| Target score line marker | `SkillsPage` | `mockRoles[0].requirements` HARDCODED role | `GET /api/roles/{id}` requirements | `CompetencyRequirement.targetLevel` | `role_competencies` | No | No |
| Gap value (+6, -3, -28) | `SkillsPage` | computed client-side from mock | computed from skills + role requirements | derived | derived | No | No |
| Historical trajectory (SVG charts) | `SkillsPage` trajectory section | `est.skillHistory` embedded in mock | `GET /api/users/{id}/skills/history` | `HistoricalDataPoint[]` | `skill_history` | Graphiti temporal | No |
| Gap analysis rows | `SkillsPage` gap section | `mockGapAnalysis` via `skillService` | `GET /api/users/{id}/gaps?roleId={id}` | `GapAnalysis[]` | computed | No | No |

---

## Page: `/plan` (Improvement Plan)

| Displayed Value | Component | Current Source | Future API | Backend Entity | DB Table | Graphiti | Real-time |
|---|---|---|---|---|---|---|---|
| ALL DATA | `PlanPage` (shell) | NOT IMPLEMENTED | `GET /api/users/{id}/plan` | `ImprovementPlan` | `improvement_tasks` | Graphiti weaknesses | No |
| Task list | - | - | `plan.tasks[]` | `ImprovementTask` | `improvement_tasks` | No | No |
| Focus competencies | - | - | `plan.focusCompetencies[]` | derived from gaps | computed | Graphiti gaps | No |
| Estimated improvement | - | - | `plan.estimatedImprovement` | computed | derived | No | No |

---

## Page: `/reassess` (Targeted Reassessment)

| Displayed Value | Component | Current Source | Future API | Backend Entity | DB Table | Graphiti | Real-time |
|---|---|---|---|---|---|---|---|
| ALL DATA | `ReassessPage` (shell) | NOT IMPLEMENTED | `POST /api/reassess` | `AssessmentSession` (scoped) | `assessment_sessions` | Graphiti recommended focus | No |

---

## Hardcoded Values That Must Be Eliminated

| Location | Value | Action Required |
|---|---|---|
| `LandingPage.tsx` lines 17-23 | `mockSkillDisplay` array with all scores | Replace with real user data or label as demo explicitly |
| `LandingPage.tsx` annotations | '04 / 10', 'HARD', 'MED to HARD', '72' | Replace with backend data OR label as demo |
| `LandingPage.tsx` line 283 | "Junior Software Engineer" hardcoded | Replace with user target role from backend |
| `LandingPage.tsx` line 285 | "Session 03" hardcoded | Replace with actual session count |
| `InterviewPage.tsx` lines 11-16 | `competencyNameMap` hardcoded dictionary | Remove - competency name comes in question response |
| `InterviewPage.tsx` line 37 | `mockRoles.find(...)` direct mock import | Replace with useRole hook |
| `interviewStore.ts` line 48 | `skillEstimates: mockSkillEstimates` | Initialize as empty array, populate from session |
| `interviewStore.ts` line 49 | `adaptiveState: mockAdaptiveState` | Initialize as null, populate from session |
| `useInterview.ts` line 53 | `mockTranscript` hardcoded string | Replace with real STT transcript |
| `SkillsPage.tsx` line 4 | `import { mockRoles }` | Replace with useRole hook |
| `SkillsPage.tsx` line 18 | `const role = mockRoles[0]` | Replace with user target role from backend |
| `SkillsPage.tsx` line 54 | "Sessions Completed: 3" hardcoded | Replace with user stats from backend |

---

## Summary: Update Matrix

| Screen | Status | Needs Backend | Needs WebSocket | Needs Graphiti |
|---|---|---|---|---|
| `/` Landing | Fully Mocked | Required | No | No |
| `/assess` | Fully Mocked | Required | No | No |
| `/interview` | Fully Mocked | Required | Critical | Skill history |
| `/report` | Shell placeholder | Required | No | Evidence |
| `/skills` | Fully Mocked | Required | No | History |
| `/plan` | Shell placeholder | Required | No | Weaknesses |
| `/reassess` | Shell placeholder | Required | No | Focus |
