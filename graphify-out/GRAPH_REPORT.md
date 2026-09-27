# Graph Report - aiinterview  (2026-09-26)

## Corpus Check
- 129 files · ~75,605 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 923 nodes · 1782 edges · 57 communities (51 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1624e8d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- RoleCompetency
- sessions.py
- dependencies
- WSEvent
- main.py
- plugins
- answer_evaluator.py
- compilerOptions
- App.tsx
- compilerOptions
- API Contract — Phase 2
- Base
- Data Lineage — Phase 2
- voice.py
- Data Flow Map — Phase 2 Audit
- start_db.py
- Backend — AI Interviewer FastAPI
- React + TypeScript + Vite
- rules/graphify.md
- ReportPage.tsx
- GraphitiService
- workflows/graphify.md
- tsconfig.json
- database.py
- llm_service.py
- users.py
- SkillHistory
- Current Architecture — ADAPTIVE
- Settings
- skillService.ts
- reassess.py
- AdaptiveStatePanel.tsx
- setup.ts
- websocket_session
- FrontendVoiceService
- AssessmentPage.tsx
- roles.py
- graphiti_service.py
- delay
- useInterview.ts
- roleService.ts
- assessmentService.ts
- VoiceOrb.tsx
- interviewStore.ts
- CourseRecommendationService
- interviewService.ts
- SkillsPage.tsx
- migrate_db.py
- types/assessment.ts
- test_db_connection.py
- FastAPI
- InterviewPage.tsx
- test_api_endpoints.py

## God Nodes (most connected - your core abstractions)
1. `delay()` - 37 edges
2. `Base` - 24 edges
3. `AssessmentSession` - 19 edges
4. `submit_answer()` - 19 edges
5. `compilerOptions` - 19 edges
6. `Data Lineage — Phase 2` - 18 edges
7. `react` - 17 edges
8. `RoleCompetency` - 17 edges
9. `Role` - 16 edges
10. `SkillEstimate` - 16 edges

## Surprising Connections (you probably didn't know these)
- `lifespan()` --uses--> `Base`  [INFERRED]
  backend/app/main.py → backend/app/database.py
- `seed()` --uses--> `Base`  [INFERRED]
  backend/scripts/seed_db.py → backend/app/database.py
- `get_report()` --uses--> `QuestionAttempt`  [INFERRED]
  backend/app/routers/sessions.py → backend/app/models/answer.py
- `submit_answer()` --uses--> `QuestionAttempt`  [INFERRED]
  backend/app/routers/sessions.py → backend/app/models/answer.py
- `AdaptiveEngine` --uses--> `QuestionAttempt`  [INFERRED]
  backend/app/services/adaptive_engine.py → backend/app/models/answer.py

## Import Cycles
- None detected.

## Communities (57 total, 6 thin omitted)

### Community 0 - "RoleCompetency"
Cohesion: 0.15
Nodes (14): Question, app/models/question.py — Question ORM model. PostgreSQL is the canonical source…, Competency, app/models/role.py — Role, Competency, and RoleCompetency ORM models.…, Join table: maps a Role to a Competency with target level and importance., Role, RoleCompetency, User (+6 more)

### Community 1 - "sessions.py"
Cohesion: 0.07
Nodes (66): create_session(), _evidence_to_schema(), _generate_recommendations(), _generate_summary(), get_current_state(), get_report(), get_session(), _get_session_or_404() (+58 more)

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (45): axios, framer-motion, lucide-react, oxlint, dependencies, axios, framer-motion, lucide-react (+37 more)

### Community 3 - "WSEvent"
Cohesion: 0.15
Nodes (14): BaseModel, app/schemas/ws.py — WebSocket event schemas., WSEvent, ConnectionManager, _handle_client_event(), handle_session_ws(), WebSocket, app/ws/session_ws.py — WebSocket handler for real-time interview events.… (+6 more)

### Community 4 - "main.py"
Cohesion: 0.13
Nodes (7): health(), get, app/main.py — FastAPI application entrypoint. Registers: - CORS middleware…, root(), backend/scripts/test_e2e_interview.py — End-to-end integration test of the…, backend/scripts/test_full_pipeline.py — Full interview pipeline integration…, backend/scripts/test_session_endpoints.py — Tests the required session…

### Community 5 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 6 - "answer_evaluator.py"
Cohesion: 0.14
Nodes (11): AnswerEvaluator, EvaluationResult, EvidenceItem, app/services/answer_evaluator.py — LLM-based answer evaluation service.…, Keyword-expansion semantic fallback. Used when no LLM key is configured or call…, Evaluates interview answers against expected concepts. Uses LLMService when…, app/services/translation_service.py — Multilingual Interview & Professional…, Translates an interview question to the candidate's selected language. If… (+3 more)

### Community 7 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly (+17 more)

### Community 8 - "App.tsx"
Cohesion: 0.05
Nodes (47): react, App(), queryClient, ProtectedRoute(), ProtectedRouteProps, CreateAssessmentModal(), CreateAssessmentModalProps, SCAN_STEPS (+39 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 10 - "API Contract — Phase 2"
Cohesion: 0.06
Nodes (31): API Contract — Phase 2, ASSESSMENT SESSIONS, Base URLs, Error Response Shape, Frontend Service Interface Contracts, GET /api/roles, GET /api/roles/{role_id}, GET /api/roles/{role_id}/blueprint (+23 more)

### Community 11 - "Base"
Cohesion: 0.18
Nodes (13): Base, AnswerEvidence, QuestionAttempt, app/models/answer.py — QuestionAttempt and AnswerEvidence ORM models. Every…, Individual concept coverage item from LLM evaluation. Records whether a…, app/models/__init__.py — Exports all ORM models so Alembic can discover them., AssessmentSession, app/models/session.py — AssessmentSession ORM model. One session = one complete… (+5 more)

### Community 12 - "Data Lineage — Phase 2"
Cohesion: 0.11
Nodes (18): ADAPTIVE SEARCH REGION (MED to HARD), COMPETENCY NAME (DEBUGGING), Data Lineage — Phase 2, DEBUGGING CONFIDENCE, DEBUGGING GAP (-28), DEBUGGING SCORE, EVIDENCE ITEMS, IMPROVEMENT PLAN TASKS (+10 more)

### Community 13 - "voice.py"
Cohesion: 0.24
Nodes (10): generate_speech(), get_voice_status(), BaseModel, get, post, app/routers/voice.py — Text-to-speech voice streaming endpoint. POST…, Returns whether the ElevenLabs voice service is active and configured., Streams audio/mpeg bytes generated by ElevenLabs for the provided text. The… (+2 more)

### Community 14 - "Data Flow Map — Phase 2 Audit"
Cohesion: 0.18
Nodes (10): Data Flow Map — Phase 2 Audit, Hardcoded Values That Must Be Eliminated, Page: `/assess` (Assessment Configuration), Page: `/interview` (Live Interview), Page: `/` (Landing Page), Page: `/plan` (Improvement Plan), Page: `/reassess` (Targeted Reassessment), Page: `/report` (Assessment Report) (+2 more)

### Community 15 - "start_db.py"
Cohesion: 0.39
Nodes (11): ensure_db_and_user(), find_postgres_bin(), is_port_in_use(), is_postgres_ready(), main(), backend/scripts/start_db.py — Local development PostgreSQL runner for Windows.…, Finds postgres binaries from pgserver package or PATH., start_server() (+3 more)

### Community 16 - "Backend — AI Interviewer FastAPI"
Cohesion: 0.18
Nodes (10): 1. Setup Python Environment, 2. Install Dependencies, 3. Database Setup (PostgreSQL), 4. Configure Environment Variables, 5. Seed the Database, 6. Start the FastAPI Backend Server, 7. Start the Frontend in API Mode, 8. Run Verification Tests (+2 more)

### Community 17 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 19 - "ReportPage.tsx"
Cohesion: 0.21
Nodes (9): competencyNameMap, LiveEstimatePanel(), competencyNameMap, ReportPage(), loadData(), formatConfidence(), formatScore(), trendSymbol() (+1 more)

### Community 20 - "GraphitiService"
Cohesion: 0.10
Nodes (11): GraphitiService, Any, Records the initiation of an assessment session into the candidate's temporal…, Records candidate answer evidence for a specific concept tested by a question.…, Records a competency score transition in the user's temporal skill narrative.…, Records candidate progress on recommended improvement activities., Searches candidate contextual memory for relevant history, weaknesses, or prior…, Clean service abstraction for Graphiti temporal knowledge graph operations.… (+3 more)

### Community 26 - "database.py"
Cohesion: 0.12
Nodes (4): app/config.py — Application configuration loaded from environment variables.…, app/database.py — Async SQLAlchemy engine and session factory. All DB…, app/models/user.py — User ORM model. Keeps user identity and their current…, backend/scripts/verify_schema.py — Verifies current_question_id column in…

### Community 27 - "llm_service.py"
Cohesion: 0.05
Nodes (35): ABC, LLMEvaluationOutput, LLMEvidenceItem, LLMQuestionOutput, LLMReportOutput, LLMService, Any, BaseModel (+27 more)

### Community 28 - "users.py"
Cohesion: 0.14
Nodes (21): ImprovementTask, app/models/plan.py — ImprovementTask ORM model. Generated by the plan_generator…, get_gaps(), get_plan(), get_skill(), get_skill_history(), get_skills(), get_stats() (+13 more)

### Community 29 - "SkillHistory"
Cohesion: 0.19
Nodes (10): Immutable record of a skill estimate at a specific point in time (per session).…, SkillHistory, AsyncSession, app/services/skill_estimator.py — Skill estimate update service. After each…, Map numeric score to estimated level string., Updates skill estimates based on answer correctness and evidence quality. Phase…, Update (or create) the skill estimate for a user/competency pair. Returns the…, _score_to_level() (+2 more)

### Community 30 - "Current Architecture — ADAPTIVE"
Cohesion: 0.18
Nodes (10): Backend (`backend/.env`), Backend Pipeline (submit_answer), Current Architecture — ADAPTIVE, Frontend (`.env`), Key Files, Report Pipeline, Required Environment Variables, Status Matrix (+2 more)

### Community 32 - "skillService.ts"
Cohesion: 0.16
Nodes (17): useGapAnalysis(), useImprovementPlan(), mockGapAnalysis, mockImprovementPlan, mockSkillEstimates, getGapAnalysis(), getImprovementPlan(), getSkillProfile() (+9 more)

### Community 33 - "reassess.py"
Cohesion: 0.31
Nodes (8): AsyncSession, BaseModel, post, app/routers/reassess.py — Targeted reassessment endpoint. POST /api/reassess, Creates a targeted reassessment session focused only on weak competencies. Does…, ReassessRequest, ReassessResponse, start_reassessment()

### Community 34 - "AdaptiveStatePanel.tsx"
Cohesion: 0.40
Nodes (5): actionLabels, AdaptiveStatePanel(), AdaptiveStatePanelProps, difficultyOrder, difficultyPosition()

### Community 35 - "setup.ts"
Cohesion: 0.18
Nodes (11): COMPETENCY_NAMES, SECTORS, AssessmentDuration, RoleLevel, AssessmentSetup, QuestionSet, QuestionSource, ScanState (+3 more)

### Community 36 - "websocket_session"
Cohesion: 0.67
Nodes (3): websocket, Real-time interview event stream. Handles: audio state, transcription,…, websocket_session()

### Community 38 - "AssessmentPage.tsx"
Cohesion: 0.13
Nodes (17): DEFAULT_LANGUAGE_CODE, INDIAN_LANGUAGES, LanguageConfig, MODE_2_SUPPORTED_LANGUAGES, AssessmentPage(), AVAILABLE_LANGUAGES, DEFAULT_COMPETENCIES, LEVELS (+9 more)

### Community 39 - "roles.py"
Cohesion: 0.17
Nodes (21): get_db(), AsyncSession, FastAPI dependency: yields an async DB session., get_blueprint(), get_role(), get_roles(), AsyncSession, get (+13 more)

### Community 42 - "delay"
Cohesion: 0.08
Nodes (19): delay(), AuthUser, mockAuthUsers, DocumentQuestionItem, mockDocumentQuestions, QuestionSourceType, DocumentProfile, DocumentTopicSummary (+11 more)

### Community 43 - "useInterview.ts"
Cohesion: 0.19
Nodes (13): SpeechRecognitionCtor, SpeechRecognitionErrorEventLike, SpeechRecognitionEventLike, SpeechRecognitionInstance, useInterview(), API_BASE_URL, apiClient, DATA_MODE (+5 more)

### Community 44 - "roleService.ts"
Cohesion: 0.25
Nodes (11): useAssessmentBlueprint(), useRole(), mockRoles, getAssessmentBlueprint(), getRoleById(), getTargetRoles(), mapRole(), AssessmentConfig (+3 more)

### Community 45 - "assessmentService.ts"
Cohesion: 0.26
Nodes (10): mockAdaptiveState, mockSession, mockInterviewState, activeSessionConfigs, createSession(), getAdaptiveState(), getSession(), mapSession() (+2 more)

### Community 46 - "VoiceOrb.tsx"
Cohesion: 0.22
Nodes (6): stateConfig, VoiceOrb(), VoiceOrbProps, InterviewEvent, LiveInterviewState, VoiceState

### Community 47 - "interviewStore.ts"
Cohesion: 0.33
Nodes (9): LiveEstimatePanelProps, SubmitAnswerResult, AdaptationNotice, initialState, InterviewStore, AdaptiveState, InterviewLanguageMode, QuestionAttempt (+1 more)

### Community 48 - "CourseRecommendationService"
Cohesion: 0.29
Nodes (5): CourseRecommendationService, app/services/course_recommendation_service.py — Curated learning resource…, Returns curated learning resources for a given competency gap. MVP: Uses a…, Returns {"free": [...], "paid": [...]} resource lists for a competency. Ordered…, Returns a flat list of recommendations for multiple competency gaps.…

### Community 49 - "interviewService.ts"
Cohesion: 0.31
Nodes (8): mockQuestions, getActiveSessionConfig(), BackendAttempt, BackendQuestion, completeInterview(), getNextQuestion(), mapQuestion(), InterviewQuestion

### Community 50 - "SkillsPage.tsx"
Cohesion: 0.67
Nodes (3): competencyNameMap, SkillsPage(), useSkillProfile()

### Community 51 - "migrate_db.py"
Cohesion: 0.67
Nodes (3): get_columns(), migrate(), backend/scripts/migrate_db.py — Schema migration script for local development.…

### Community 52 - "types/assessment.ts"
Cohesion: 0.22
Nodes (9): AnswerEvidence, AssessmentReport, AssessmentStatus, CourseResource, Difficulty, QuestionType, ReportEvidence, ResourceRecommendations (+1 more)

### Community 53 - "test_db_connection.py"
Cohesion: 0.48
Nodes (6): main(), print_sanitized_config(), backend/scripts/test_db_connection.py — Diagnostic script to test PostgreSQL…, test_asyncpg(), test_schema(), test_sqlalchemy()

### Community 54 - "FastAPI"
Cohesion: 0.33
Nodes (6): _format_db_error_banner(), lifespan(), Formats a concise, actionable error banner with real diagnostics when…, Create all tables on startup and initialize services., Exception, FastAPI

### Community 55 - "InterviewPage.tsx"
Cohesion: 0.60
Nodes (4): getLanguageByCode(), competencyNameMap, InterviewPage(), padIndex()

### Community 56 - "test_api_endpoints.py"
Cohesion: 0.67
Nodes (3): main(), backend/scripts/test_api_endpoints.py — Verifies the complete session lifecycle…, request()

## Knowledge Gaps
- **200 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+195 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `delay()` connect `delay` to `skillService.ts`, `App.tsx`, `useInterview.ts`, `roleService.ts`, `assessmentService.ts`, `interviewService.ts`, `ReportPage.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `GraphitiService` connect `GraphitiService` to `RoleCompetency`, `graphiti_service.py`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `plugins`, `AssessmentPage.tsx`, `useInterview.ts`, `ReportPage.tsx`, `InterviewPage.tsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Base` (e.g. with `lifespan()` and `seed()`) actually correct?**
  _`Base` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `AssessmentSession` (e.g. with `start_reassessment()` and `create_session()`) actually correct?**
  _`AssessmentSession` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `submit_answer()` (e.g. with `AnswerEvidence` and `QuestionAttempt`) actually correct?**
  _`submit_answer()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _200 weakly-connected nodes found - possible documentation gaps or missing edges._