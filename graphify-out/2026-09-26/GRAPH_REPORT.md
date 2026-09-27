# Graph Report - aiinterview  (2026-09-26)

## Corpus Check
- 107 files · ~54,505 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 796 nodes · 1497 edges · 52 communities (46 shown, 6 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1624e8d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Base
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
- models/__init__.py
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
- LLMService
- users.py
- .update_estimate
- Current Architecture — ADAPTIVE
- Settings
- types/assessment.ts
- reassess.py
- InterviewPage.tsx
- setup.ts
- websocket_session
- FrontendVoiceService
- AssessmentPage.tsx
- roles.py
- graphiti_service.py
- OpenAIVoiceService
- test_session_endpoints.py
- useAssessment.ts
- llm_service.py
- ElevenLabsVoiceService
- voice_service.py
- CourseRecommendationService
- roleService.ts
- SkillsPage.tsx
- migrate_db.py

## God Nodes (most connected - your core abstractions)
1. `Base` - 24 edges
2. `delay()` - 20 edges
3. `AssessmentSession` - 19 edges
4. `submit_answer()` - 19 edges
5. `compilerOptions` - 19 edges
6. `Data Lineage — Phase 2` - 18 edges
7. `RoleCompetency` - 17 edges
8. `Role` - 16 edges
9. `SkillEstimate` - 16 edges
10. `get_report()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `lifespan()` --uses--> `Base`  [INFERRED]
  backend/app/main.py → backend/app/database.py
- `get_report()` --uses--> `QuestionAttempt`  [INFERRED]
  backend/app/routers/sessions.py → backend/app/models/answer.py
- `submit_answer()` --uses--> `QuestionAttempt`  [INFERRED]
  backend/app/routers/sessions.py → backend/app/models/answer.py
- `AdaptiveEngine` --uses--> `QuestionAttempt`  [INFERRED]
  backend/app/services/adaptive_engine.py → backend/app/models/answer.py
- `submit_answer()` --uses--> `AnswerEvidence`  [INFERRED]
  backend/app/routers/sessions.py → backend/app/models/answer.py

## Import Cycles
- None detected.

## Communities (52 total, 6 thin omitted)

### Community 0 - "Base"
Cohesion: 0.16
Nodes (16): Base, Question, app/models/question.py — Question ORM model. PostgreSQL is the canonical source…, Competency, app/models/role.py — Role, Competency, and RoleCompetency ORM models.…, Join table: maps a Role to a Competency with target level and importance., Role, RoleCompetency (+8 more)

### Community 1 - "sessions.py"
Cohesion: 0.08
Nodes (59): create_session(), _evidence_to_schema(), _generate_recommendations(), _generate_summary(), get_current_state(), get_report(), get_session(), _get_session_or_404() (+51 more)

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (45): axios, framer-motion, lucide-react, oxlint, dependencies, axios, framer-motion, lucide-react (+37 more)

### Community 3 - "WSEvent"
Cohesion: 0.15
Nodes (14): BaseModel, app/schemas/ws.py — WebSocket event schemas., WSEvent, ConnectionManager, _handle_client_event(), handle_session_ws(), WebSocket, app/ws/session_ws.py — WebSocket handler for real-time interview events.… (+6 more)

### Community 4 - "main.py"
Cohesion: 0.16
Nodes (10): _format_db_error_banner(), health(), lifespan(), get, app/main.py — FastAPI application entrypoint. Registers: - CORS middleware…, Formats a concise, actionable error banner when PostgreSQL is unreachable., Create all tables on startup and initialize services., root() (+2 more)

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
Cohesion: 0.18
Nodes (7): react, App(), queryClient, AtmosphericBackground(), NavBar(), PlanPage(), ReassessPage()

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 10 - "API Contract — Phase 2"
Cohesion: 0.06
Nodes (31): API Contract — Phase 2, ASSESSMENT SESSIONS, Base URLs, Error Response Shape, Frontend Service Interface Contracts, GET /api/roles, GET /api/roles/{role_id}, GET /api/roles/{role_id}/blueprint (+23 more)

### Community 11 - "models/__init__.py"
Cohesion: 0.13
Nodes (16): AnswerEvidence, QuestionAttempt, app/models/answer.py — QuestionAttempt and AnswerEvidence ORM models. Every…, Individual concept coverage item from LLM evaluation. Records whether a…, app/models/__init__.py — Exports all ORM models so Alembic can discover them., AssessmentSession, app/models/session.py — AssessmentSession ORM model. One session = one complete…, app/models/skill.py — SkillEstimate and SkillHistory ORM models. SkillEstimate:… (+8 more)

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
Cohesion: 0.40
Nodes (9): find_postgres_bin(), is_port_in_use(), main(), backend/scripts/start_db.py — Local development PostgreSQL runner for Windows.…, Finds postgres binaries from pgserver package or PATH., start_server(), status_server(), stop_server() (+1 more)

### Community 16 - "Backend — AI Interviewer FastAPI"
Cohesion: 0.18
Nodes (10): 1. Setup Python Environment, 2. Install Dependencies, 3. Database Setup (PostgreSQL), 4. Configure Environment Variables, 5. Seed the Database, 6. Start the FastAPI Backend Server, 7. Start the Frontend in API Mode, 8. Run Verification Tests (+2 more)

### Community 17 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 19 - "ReportPage.tsx"
Cohesion: 0.19
Nodes (11): competencyNameMap, LiveEstimatePanel(), LiveEstimatePanelProps, competencyNameMap, ReportPage(), loadData(), formatConfidence(), formatScore() (+3 more)

### Community 20 - "GraphitiService"
Cohesion: 0.10
Nodes (11): GraphitiService, Any, Records the initiation of an assessment session into the candidate's temporal…, Records candidate answer evidence for a specific concept tested by a question.…, Records a competency score transition in the user's temporal skill narrative.…, Records candidate progress on recommended improvement activities., Searches candidate contextual memory for relevant history, weaknesses, or prior…, Clean service abstraction for Graphiti temporal knowledge graph operations.… (+3 more)

### Community 26 - "database.py"
Cohesion: 0.11
Nodes (6): get_db(), AsyncSession, app/database.py — Async SQLAlchemy engine and session factory. All DB…, FastAPI dependency: yields an async DB session., app/models/user.py — User ORM model. Keeps user identity and their current…, backend/scripts/verify_schema.py — Verifies current_question_id column in…

### Community 27 - "LLMService"
Cohesion: 0.22
Nodes (7): LLMService, Any, Generates a new adaptive interview question tailored to the candidate's target…, Evaluates a candidate's spoken response against expected concepts. Extracts…, Synthesizes a comprehensive diagnostic report and actionable recommendations…, Returns True if an LLM API key is configured., Calls the OpenAI-compatible chat completions endpoint with structured JSON…

### Community 28 - "users.py"
Cohesion: 0.11
Nodes (28): ImprovementTask, app/models/plan.py — ImprovementTask ORM model. Generated by the plan_generator…, get_gaps(), get_plan(), get_skill(), get_skill_history(), get_skills(), get_stats() (+20 more)

### Community 29 - ".update_estimate"
Cohesion: 0.33
Nodes (5): AsyncSession, Map numeric score to estimated level string., Update (or create) the skill estimate for a user/competency pair. Returns the…, _score_to_level(), SkillEstimate

### Community 30 - "Current Architecture — ADAPTIVE"
Cohesion: 0.18
Nodes (10): Backend (`backend/.env`), Backend Pipeline (submit_answer), Current Architecture — ADAPTIVE, Frontend (`.env`), Key Files, Report Pipeline, Required Environment Variables, Status Matrix (+2 more)

### Community 31 - "Settings"
Cohesion: 0.17
Nodes (3): app/config.py — Application configuration loaded from environment variables.…, Settings, BaseSettings

### Community 32 - "types/assessment.ts"
Cohesion: 0.05
Nodes (68): AdaptiveStatePanelProps, stateConfig, VoiceOrb(), VoiceOrbProps, SpeechRecognitionCtor, SpeechRecognitionErrorEventLike, SpeechRecognitionEventLike, SpeechRecognitionInstance (+60 more)

### Community 33 - "reassess.py"
Cohesion: 0.31
Nodes (8): AsyncSession, BaseModel, post, app/routers/reassess.py — Targeted reassessment endpoint. POST /api/reassess, Creates a targeted reassessment session focused only on weak competencies. Does…, ReassessRequest, ReassessResponse, start_reassessment()

### Community 34 - "InterviewPage.tsx"
Cohesion: 0.29
Nodes (8): actionLabels, AdaptiveStatePanel(), difficultyOrder, difficultyPosition(), competencyNameMap, InterviewPage(), useInterview(), padIndex()

### Community 35 - "setup.ts"
Cohesion: 0.18
Nodes (10): COMPETENCY_NAMES, SECTORS, AssessmentDuration, AssessmentSetup, QuestionSet, QuestionSource, ScanState, Sector (+2 more)

### Community 36 - "websocket_session"
Cohesion: 0.27
Nodes (4): websocket, Real-time interview event stream. Handles: audio state, transcription,…, websocket_session(), backend/scripts/test_full_pipeline.py — Full interview pipeline integration…

### Community 38 - "AssessmentPage.tsx"
Cohesion: 0.13
Nodes (17): DEFAULT_LANGUAGE_CODE, getLanguageByCode(), INDIAN_LANGUAGES, LanguageConfig, MODE_2_SUPPORTED_LANGUAGES, AssessmentPage(), AVAILABLE_LANGUAGES, DEFAULT_COMPETENCIES (+9 more)

### Community 39 - "roles.py"
Cohesion: 0.22
Nodes (18): get_blueprint(), get_role(), get_roles(), AsyncSession, get, app/routers/roles.py — Role and competency endpoints. GET /api/roles GET…, Returns all available target roles with their competency models., Returns a single role with full competency model. (+10 more)

### Community 42 - "OpenAIVoiceService"
Cohesion: 0.18
Nodes (4): OpenAIVoiceService, OpenAI TTS service generating streaming MP3 chunks., Dispatches to ElevenLabs or OpenAI TTS depending on available credentials., UnifiedVoiceService

### Community 44 - "useAssessment.ts"
Cohesion: 0.24
Nodes (11): LandingPage(), useAssessmentBlueprint(), useCreateSession(), useRole(), useTargetRoles(), createSession(), getAssessmentBlueprint(), getRoleById() (+3 more)

### Community 45 - "llm_service.py"
Cohesion: 0.44
Nodes (8): LLMEvaluationOutput, LLMEvidenceItem, LLMQuestionOutput, LLMReportOutput, BaseModel, app/services/llm_service.py — Clean, provider-agnostic LLM service abstraction.…, backend/scripts/test_llm_integration.py — Tests dynamic LLM question…, test_llm_flow()

### Community 46 - "ElevenLabsVoiceService"
Cohesion: 0.27
Nodes (6): ElevenLabsVoiceService, ElevenLabs TTS service using official async SDK., main(), backend/scripts/test_live_credentials.py — Verify live LLM and ElevenLabs…, test_elevenlabs(), test_llm()

### Community 47 - "voice_service.py"
Cohesion: 0.25
Nodes (6): ABC, app/services/voice_service.py — Text-to-Speech (TTS) service abstraction.…, Abstract interface for text-to-speech services., Returns True if the voice provider is configured with credentials., Streams audio bytes for the given text., VoiceService

### Community 48 - "CourseRecommendationService"
Cohesion: 0.29
Nodes (5): CourseRecommendationService, app/services/course_recommendation_service.py — Curated learning resource…, Returns curated learning resources for a given competency gap. MVP: Uses a…, Returns {"free": [...], "paid": [...]} resource lists for a competency. Ordered…, Returns a flat list of recommendations for multiple competency gaps.…

### Community 49 - "roleService.ts"
Cohesion: 0.46
Nodes (5): mockRoles, CompetencyRequirement, RoleBlueprint, RoleLevel, TargetRole

### Community 50 - "SkillsPage.tsx"
Cohesion: 0.47
Nodes (4): SystemFooter(), competencyNameMap, SkillsPage(), useSkillProfile()

### Community 51 - "migrate_db.py"
Cohesion: 0.67
Nodes (3): get_columns(), migrate(), backend/scripts/migrate_db.py — Schema migration script for local development.…

## Knowledge Gaps
- **181 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+176 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GraphitiService` connect `GraphitiService` to `Base`, `graphiti_service.py`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `AssessmentSession` connect `models/__init__.py` to `Base`, `reassess.py`, `sessions.py`, `llm_service.py`, `users.py`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Base` (e.g. with `lifespan()` and `seed()`) actually correct?**
  _`Base` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `AssessmentSession` (e.g. with `start_reassessment()` and `create_session()`) actually correct?**
  _`AssessmentSession` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `submit_answer()` (e.g. with `AnswerEvidence` and `QuestionAttempt`) actually correct?**
  _`submit_answer()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _181 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sessions.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07769973661106233 - nodes in this community are weakly interconnected._