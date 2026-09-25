# Data Lineage — Phase 2

> For every metric displayed in the UI, this document traces the exact path from database to screen.
> Every number is traceable.

---

## DEBUGGING SCORE

```
UI: SkillsPage / InterviewPage (LiveEstimatePanel)
Component: SkillsPage > estimates.map > est.score
           LiveEstimatePanel > estimates > est.score

Source path:
  GET /api/users/{user_id}/skills
  Response: SkillEstimate[].score

Backend computation:
  adaptive_engine.py > SkillEstimator.compute_score()
  Input: QuestionAttempt[] for competency_id
  Algorithm: IRT (Item Response Theory) scoring
  Updates: After every answer submission to POST /api/sessions/{id}/answers

Database:
  Table: skill_estimates
  Columns: competency_id, user_id, score, updated_at

Historical context (Graphiti):
  Node: User -[HAS_SKILL_ESTIMATE]-> SkillEstimate
  Temporal: score changes tracked as versioned edges
  Query: "What was user's debugging score in session-001?"
```

---

## DEBUGGING CONFIDENCE

```
UI: SkillsPage, LiveEstimatePanel
Component: est.confidence

Source path:
  GET /api/users/{user_id}/skills
  Response: SkillEstimate[].confidence

Backend computation:
  adaptive_engine.py > SkillEstimator.compute_confidence()
  Input: evidence_count, evidence quality scores
  Formula: Confidence increases with evidence_count, quality-weighted

Database:
  Table: skill_estimates
  Columns: confidence, evidence_count

Graphiti: No — purely quantitative field
```

---

## DEBUGGING GAP (-28)

```
UI: SkillsPage gap analysis section
Component: GapAnalysis.gap = currentScore - targetScore

Source path:
  GET /api/users/{user_id}/gaps?role_id={role_id}
  Response: GapAnalysis[].gap

Backend computation:
  gap_service.py > compute_gaps(user_id, role_id)
  current_score = skill_estimates[competency_id].score
  target_score = role_competencies[competency_id].target_level
  gap = current_score - target_score

Database:
  skill_estimates.score (current)
  role_competencies.target_level (target)
  Computed at query time, not stored

Graphiti: No — computed from relational data
```

---

## TARGET SCORE (74 for Debugging)

```
UI: SkillsPage, AssessmentPage competency preview, LiveEstimatePanel
Component: req.targetLevel or CompetencyRequirement.target_level

Source path:
  GET /api/roles/{role_id}
  Response: TargetRole.requirements[].target_level

Database:
  Table: role_competencies
  Columns: role_id, competency_id, target_level, importance

Graphiti: No — static relational data
```

---

## QUESTION TEXT

```
UI: InterviewPage center panel
Component: currentQuestion.question

Source path:
  POST /api/sessions/{session_id}/next-question
  Response: InterviewQuestion.question

Backend logic:
  adaptive_engine.py > QuestionSelector.select_next()
  Input: current_difficulty, focus_competencies, attempted_question_ids
  Output: Question chosen from questions table matching criteria

Database:
  Table: questions
  Columns: id, competency_id, difficulty, question_type, question, expected_concepts

Graphiti: No — questions are static content
```

---

## QUESTION DIFFICULTY (HARD)

```
UI: InterviewPage left sidebar, center badges
Component: currentQuestion.difficulty

Source path:
  POST /api/sessions/{session_id}/next-question
  Response: InterviewQuestion.difficulty

Backend logic:
  adaptive_engine.py > AdaptiveEngine.determine_difficulty()
  Input: previous answer correctness, current estimate, search_region
  Algorithm: Binary search variant (IRT-informed)

Database:
  Table: questions.difficulty (stored per-question)
         assessment_sessions.current_difficulty (adaptive state)

Graphiti: No
```

---

## QUESTION NUMBER (04 / 10)

```
UI: InterviewPage left sidebar, center badge
Component: questionIndex + 1 / totalQuestions

Source path:
  GET /api/sessions/{session_id}
  Response: AssessmentSession.current_question_index, question_count

  OR via WebSocket event:
  question.started.payload.question_number / total_questions

Database:
  Table: assessment_sessions
  Columns: current_question_index, question_count

Graphiti: No
```

---

## COMPETENCY NAME (DEBUGGING)

```
UI: InterviewPage sidebar, center badges
Component: currentQuestion.competency.name

Source path:
  POST /api/sessions/{session_id}/next-question
  Response: InterviewQuestion.competency.name

Backend:
  Joined from questions -> competencies
  competencies.name

Database:
  Table: competencies
  Columns: id, name, category, description

Graphiti: No — static
```

---

## ADAPTIVE SEARCH REGION (MED to HARD)

```
UI: AdaptiveStatePanel
Component: adaptiveState.searchRegion.lower / upper

Source path:
  GET /api/sessions/{session_id}/current-state
  Response: adaptive_state.search_region.lower / upper

  OR via WebSocket:
  interview.state.changed.payload.adaptive_state.search_region

Backend:
  adaptive_engine.py > AdaptiveEngine.update_search_region()
  Binary search: narrows lower/upper bounds based on answer correctness

Database:
  Table: assessment_sessions
  Columns: adaptive_search_lower, adaptive_search_upper

Graphiti: No
```

---

## SKILL HISTORY CHART (trajectory SVG)

```
UI: SkillsPage trajectory section
Component: est.skillHistory -> SVG points

Source path:
  GET /api/users/{user_id}/skills/history
  Response: SkillHistory[].history[].score / timestamp

Database:
  Table: skill_history
  Columns: id, user_id, competency_id, session_id, score, confidence, timestamp

Graphiti:
  Node: User -[HAS_SKILL_AT]-> SkillSnapshot (timestamped)
  This is the KEY Graphiti use case: temporal skill evolution
  Query: "Give me the debugging score trajectory for user-001 across all sessions"
  Graphiti provides context like: "After session-002, debugging jumped from 44 to 46 after evidence of execution tracing in 3 questions"
```

---

## TRANSCRIPT

```
UI: InterviewPage center panel (transcript preview during interview)
Component: transcript state variable

Phase 1 source: HARDCODED mock string in useInterview.ts
Phase 2 source: Real-time from STT pipeline

Source path:
  WebSocket audio.transcribing event
  payload.partial_transcript -> displayed in real-time

  Final transcript stored via:
  POST /api/sessions/{session_id}/answers
  body.transcript

Database:
  Table: answers
  Columns: session_id, question_id, transcript, duration_ms

Graphiti:
  Node: Answer -[PROVIDES_EVIDENCE]-> Competency
  Context: "In session-003, user's answer about race conditions mentioned mutex and deadlock detection"
```

---

## EVIDENCE ITEMS

```
UI: ReportPage (Phase 2 only)
Component: AssessmentReport.evidence[]

Source path:
  GET /api/sessions/{session_id}/report
  Response: evidence[].concept / status / explanation

Backend:
  llm_evaluator.py > AnswerEvaluator.extract_evidence()
  Input: transcript, expectedConcepts
  Output: AnswerEvidence[] with demonstrated/partial/missing

Database:
  Table: answer_evidence
  Columns: id, attempt_id, concept, status, explanation, confidence

Graphiti:
  Node: Answer -[DEMONSTRATES]-> Concept
  Node: Answer -[MISSES]-> Concept
  Context: "User has never demonstrated understanding of deadlock prevention"
```

---

## RECOMMENDATIONS

```
UI: ReportPage (Phase 2 only)
Component: AssessmentReport.recommendations[]

Source path:
  GET /api/sessions/{session_id}/report
  Response: recommendations[]

Backend:
  report_generator.py > generate_recommendations()
  Input: gap analysis + Graphiti context (past weaknesses, missing concepts)
  LLM generates recommendations informed by gap severity and observed patterns

Database:
  Table: improvement_tasks (stored after report generation)

Graphiti:
  ESSENTIAL: "User has consistently missed concurrency concepts across 3 sessions"
  Graphiti provides the pattern that LLM uses to personalize recommendations
```

---

## TARGET ROLE TITLE

```
UI: LandingPage preview, InterviewPage sidebar, SkillsPage header
Component: role.title

Phase 1 source:
  LandingPage: HARDCODED "Junior Software Engineer"
  InterviewPage: mockRoles.find(r => r.id === targetRoleId)
  SkillsPage: mockRoles[0]

Phase 2 source:
  GET /api/roles/{role_id}
  Response: TargetRole.title

  User's target role:
  GET /api/users/{user_id}/stats
  Response: target_role_id -> then GET /api/roles/{target_role_id}

Database:
  Table: roles
  Columns: id, title, level, description

Graphiti:
  Node: User -[HAS_TARGET]-> Role
  Context: "User changed target role from Data Engineer to Junior SWE in session-002"
```

---

## IMPROVEMENT PLAN TASKS

```
UI: PlanPage (Phase 2 only)
Component: ImprovementPlan.tasks[]

Source path:
  GET /api/users/{user_id}/plan
  Response: ImprovementPlan.tasks[]

Backend:
  plan_generator.py > generate_plan()
  Input: gap analysis, evidence from sessions, Graphiti context
  LLM generates task descriptions + success criteria

Database:
  Table: improvement_tasks
  Columns: id, user_id, competency_id, title, description, observed_weakness, estimated_time, priority, completed

Graphiti:
  User -[HAS_GAP]-> Competency (severity, history)
  Graphiti: "User repeatedly fails concurrency questions, weakness is systematic"
```

---

## Voice State

```
UI: VoiceOrb, InterviewPage status indicators
Component: voiceState (VoiceState enum)

Phase 1 source: Simulated with setTimeout in useInterview.ts

Phase 2 source:
  WebSocket events mapped to voice states:
  - audio.listening -> 'listening'
  - audio.transcribing -> 'transcribing'
  - answer.evaluating -> 'evaluating'
  - question.started (speaking TTS) -> 'speaking'
  - question.completed -> 'idle'
  - interview.completed -> 'complete'

Database: Not stored — ephemeral session state

Graphiti: No — real-time UI state only
```

---

## Lineage Summary

| Metric | DB Table | Computation | Graphiti Role |
|---|---|---|---|
| Skill Score | `skill_estimates` | IRT adaptive engine | Temporal history |
| Skill Confidence | `skill_estimates` | Evidence quality formula | No |
| Gap | computed | subtraction of score - target | No |
| Target Score | `role_competencies` | Static role definition | No |
| Question Text | `questions` | Static content | No |
| Question Difficulty | `questions` + `assessment_sessions` | Adaptive engine | No |
| Question Number | `assessment_sessions` | Counter | No |
| Competency Name | `competencies` | Static | No |
| Search Region | `assessment_sessions` | Binary search | No |
| Skill History | `skill_history` | Historical records | Temporal context |
| Transcript | `answers` | STT output | Answer-evidence edges |
| Evidence | `answer_evidence` | LLM extraction | Concept graph |
| Recommendations | `improvement_tasks` | LLM + gap analysis | Pattern context |
| Target Role | `roles` | Static | User-role relationship |
| Plan Tasks | `improvement_tasks` | LLM + Graphiti context | Weakness patterns |
| Voice State | ephemeral | WebSocket events | No |
