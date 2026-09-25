# Graph Report - aiinterview  (2026-09-25)

## Corpus Check
- 88 files · ~37,209 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 689 nodes · 1289 edges · 39 communities (34 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `97589091`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Base
- database.py
- dependencies
- main.py
- GraphitiService
- plugins
- ReportPage.tsx
- compilerOptions
- roles.py
- compilerOptions
- API Contract — Phase 2
- SkillEstimate
- Data Lineage — Phase 2
- reassess.py
- Data Flow Map — Phase 2 Audit
- start_db.py
- Backend — AI Interviewer FastAPI
- React + TypeScript + Vite
- rules/graphify.md
- react
- services/__init__.py
- workflows/graphify.md
- tsconfig.json
- sessions.py
- voice.py
- users.py
- SkillHistory
- Current Architecture — ADAPTIVE
- App.tsx
- types/assessment.ts
- InterviewPage.tsx
- roleService.ts
- Settings
- SkillsPage.tsx
- FrontendVoiceService
- AssessmentPage.tsx

## God Nodes (most connected - your core abstractions)
1. `Base` - 24 edges
2. `delay()` - 20 edges
3. `compilerOptions` - 19 edges
4. `Data Lineage — Phase 2` - 18 edges
5. `AssessmentSession` - 17 edges
6. `SkillEstimate` - 16 edges
7. `submit_answer()` - 16 edges
8. `RoleCompetency` - 15 edges
9. `get_report()` - 15 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `lifespan()` --uses--> `Base`  [INFERRED]
  backend/app/main.py → backend/app/database.py
- `get_report()` --uses--> `QuestionAttempt`  [INFERRED]
  backend/app/routers/sessions.py → backend/app/models/answer.py
- `submit_answer()` --uses--> `QuestionAttempt`  [INFERRED]
  backend/app/routers/sessions.py → backend/app/models/answer.py
- `submit_answer()` --uses--> `AnswerEvidence`  [INFERRED]
  backend/app/routers/sessions.py → backend/app/models/answer.py
- `_question_to_response()` --uses--> `Question`  [INFERRED]
  backend/app/routers/sessions.py → backend/app/models/question.py

## Import Cycles
- None detected.

## Communities (39 total, 5 thin omitted)

### Community 0 - "Base"
Cohesion: 0.16
Nodes (15): Base, app/models/__init__.py — Exports all ORM models so Alembic can discover them., Question, app/models/question.py — Question ORM model. PostgreSQL is the canonical source…, Competency, app/models/role.py — Role, Competency, and RoleCompetency ORM models.…, Join table: maps a Role to a Competency with target level and importance., Role (+7 more)

### Community 1 - "database.py"
Cohesion: 0.15
Nodes (11): app/config.py — Application configuration loaded from environment variables.…, app/database.py — Async SQLAlchemy engine and session factory. All DB…, AnswerEvidence, QuestionAttempt, app/models/answer.py — QuestionAttempt and AnswerEvidence ORM models. Every…, Individual concept coverage item from LLM evaluation. Records whether a…, AssessmentSession, app/models/session.py — AssessmentSession ORM model. One session = one complete… (+3 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (43): axios, framer-motion, lucide-react, oxlint, dependencies, axios, framer-motion, lucide-react (+35 more)

### Community 3 - "main.py"
Cohesion: 0.07
Nodes (29): _format_db_error_banner(), health(), lifespan(), get, websocket, app/main.py — FastAPI application entrypoint. Registers: - CORS middleware…, Real-time interview event stream. Handles: audio state, transcription,…, Formats a concise, actionable error banner when PostgreSQL is unreachable. (+21 more)

### Community 4 - "GraphitiService"
Cohesion: 0.10
Nodes (11): Any, GraphitiService, Records the initiation of an assessment session into the candidate's temporal…, Records candidate answer evidence for a specific concept tested by a question.…, Records a competency score transition in the user's temporal skill narrative.…, Records candidate progress on recommended improvement activities., Searches candidate contextual memory for relevant history, weaknesses, or prior…, Clean service abstraction for Graphiti temporal knowledge graph operations.… (+3 more)

### Community 5 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 6 - "ReportPage.tsx"
Cohesion: 0.23
Nodes (8): competencyNameMap, LiveEstimatePanel(), competencyNameMap, ReportPage(), formatConfidence(), formatScore(), trendSymbol(), useInterviewStore

### Community 7 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly (+17 more)

### Community 8 - "roles.py"
Cohesion: 0.22
Nodes (18): get_blueprint(), get_role(), get_roles(), AsyncSession, get, app/routers/roles.py — Role and competency endpoints. GET /api/roles GET…, Returns all available target roles with their competency models., Returns a single role with full competency model. (+10 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 10 - "API Contract — Phase 2"
Cohesion: 0.06
Nodes (31): API Contract — Phase 2, ASSESSMENT SESSIONS, Base URLs, Error Response Shape, Frontend Service Interface Contracts, GET /api/roles, GET /api/roles/{role_id}, GET /api/roles/{role_id}/blueprint (+23 more)

### Community 11 - "SkillEstimate"
Cohesion: 0.22
Nodes (13): SkillEstimate, get_gaps(), get_skill(), get_skill_history(), get_skills(), get_stats(), AsyncSession, get (+5 more)

### Community 12 - "Data Lineage — Phase 2"
Cohesion: 0.11
Nodes (18): ADAPTIVE SEARCH REGION (MED to HARD), COMPETENCY NAME (DEBUGGING), Data Lineage — Phase 2, DEBUGGING CONFIDENCE, DEBUGGING GAP (-28), DEBUGGING SCORE, EVIDENCE ITEMS, IMPROVEMENT PLAN TASKS (+10 more)

### Community 13 - "reassess.py"
Cohesion: 0.21
Nodes (11): get_db(), AsyncSession, FastAPI dependency: yields an async DB session., AsyncSession, BaseModel, post, app/routers/reassess.py — Targeted reassessment endpoint. POST /api/reassess, Creates a targeted reassessment session focused only on weak competencies. Does… (+3 more)

### Community 14 - "Data Flow Map — Phase 2 Audit"
Cohesion: 0.18
Nodes (10): Data Flow Map — Phase 2 Audit, Hardcoded Values That Must Be Eliminated, Page: `/assess` (Assessment Configuration), Page: `/interview` (Live Interview), Page: `/` (Landing Page), Page: `/plan` (Improvement Plan), Page: `/reassess` (Targeted Reassessment), Page: `/report` (Assessment Report) (+2 more)

### Community 15 - "start_db.py"
Cohesion: 0.40
Nodes (9): find_postgres_bin(), is_port_in_use(), main(), backend/scripts/start_db.py — Local development PostgreSQL runner for Windows.…, Finds postgres binaries from pgserver package or PATH., start_server(), status_server(), stop_server() (+1 more)

### Community 16 - "Backend — AI Interviewer FastAPI"
Cohesion: 0.20
Nodes (9): 1. Database Setup (PostgreSQL required), 2. Configure Environment, 3. Seed Database, Backend — AI Interviewer FastAPI, Environment & Database, Graphiti & Neo4j (Contextual Layer), Run Backend, Setup (+1 more)

### Community 17 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 19 - "react"
Cohesion: 0.21
Nodes (10): react, AdaptivePathDiagram(), Edge, edges, Node, nodes, toSVG(), LandingPage() (+2 more)

### Community 20 - "services/__init__.py"
Cohesion: 0.15
Nodes (13): AnswerEvaluator, EvaluationResult, EvidenceItem, app/services/answer_evaluator.py — LLM-based answer evaluation service.…, Calls Groq's OpenAI-compatible chat completions endpoint. Uses…, Keyword-expansion semantic fallback. Used when no Groq key is available or Groq…, Evaluates interview answers against expected concepts. Uses Groq…, CourseRecommendationService (+5 more)

### Community 26 - "sessions.py"
Cohesion: 0.08
Nodes (59): create_session(), _evidence_to_schema(), _generate_recommendations(), _generate_summary(), get_current_state(), get_report(), get_session(), _get_session_or_404() (+51 more)

### Community 27 - "voice.py"
Cohesion: 0.09
Nodes (19): ABC, generate_speech(), get_voice_status(), BaseModel, get, post, app/routers/voice.py — Text-to-speech voice streaming endpoint. POST…, Returns whether the ElevenLabs voice service is active and configured. (+11 more)

### Community 28 - "users.py"
Cohesion: 0.16
Nodes (15): ImprovementTask, app/models/plan.py — ImprovementTask ORM model. Generated by the plan_generator…, get_plan(), app/routers/users.py — User skill profile and stats endpoints. GET…, Returns the user's current improvement plan., ImprovementPlanSchema, ImprovementTaskSchema, BaseModel (+7 more)

### Community 29 - "SkillHistory"
Cohesion: 0.17
Nodes (11): app/models/skill.py — SkillEstimate and SkillHistory ORM models. SkillEstimate:…, Immutable record of a skill estimate at a specific point in time (per session).…, SkillHistory, AsyncSession, app/services/skill_estimator.py — Skill estimate update service. After each…, Map numeric score to estimated level string., Updates skill estimates based on answer correctness and evidence quality. Phase…, Update (or create) the skill estimate for a user/competency pair. Returns the… (+3 more)

### Community 30 - "Current Architecture — ADAPTIVE"
Cohesion: 0.18
Nodes (10): Backend (`backend/.env`), Backend Pipeline (submit_answer), Current Architecture — ADAPTIVE, Frontend (`.env`), Key Files, Report Pipeline, Required Environment Variables, Status Matrix (+2 more)

### Community 31 - "App.tsx"
Cohesion: 0.25
Nodes (5): App(), queryClient, NavBar(), PlanPage(), ReassessPage()

### Community 32 - "types/assessment.ts"
Cohesion: 0.05
Nodes (67): actionLabels, AdaptiveStatePanel(), AdaptiveStatePanelProps, difficultyOrder, difficultyPosition(), LiveEstimatePanelProps, stateConfig, VoiceOrbProps (+59 more)

### Community 33 - "InterviewPage.tsx"
Cohesion: 0.38
Nodes (5): VoiceOrb(), competencyNameMap, InterviewPage(), useInterview(), padIndex()

### Community 34 - "roleService.ts"
Cohesion: 0.20
Nodes (14): loadData(), useAssessmentBlueprint(), useRole(), useTargetRoles(), mockRoles, getAssessmentBlueprint(), getRoleById(), getTargetRoles() (+6 more)

### Community 36 - "SkillsPage.tsx"
Cohesion: 0.36
Nodes (8): competencyNameMap, SkillsPage(), useGapAnalysis(), useImprovementPlan(), useSkillProfile(), getGapAnalysis(), getImprovementPlan(), getSkillProfile()

### Community 38 - "AssessmentPage.tsx"
Cohesion: 0.29
Nodes (5): AssessmentPage(), durationOptions, levelOptions, useCreateSession(), AssessmentDuration

## Knowledge Gaps
- **173 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GraphitiService` connect `GraphitiService` to `main.py`, `services/__init__.py`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `types/assessment.ts`, `InterviewPage.tsx`, `plugins`, `AssessmentPage.tsx`, `ReportPage.tsx`, `App.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `Base` connect `Base` to `database.py`, `main.py`, `SkillEstimate`, `users.py`, `SkillHistory`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Base` (e.g. with `lifespan()` and `seed()`) actually correct?**
  _`Base` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `AssessmentSession` (e.g. with `start_reassessment()` and `create_session()`) actually correct?**
  _`AssessmentSession` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `database.py` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._