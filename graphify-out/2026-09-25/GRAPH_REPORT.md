# Graph Report - aiinterview  (2026-09-25)

## Corpus Check
- 82 files · ~32,324 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 624 nodes · 1173 edges · 26 communities (22 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4e2c4da1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- users.py
- sessions.py
- dependencies
- main.py
- GraphitiService
- plugins
- App.tsx
- compilerOptions
- roles.py
- compilerOptions
- API Contract — Phase 2
- types/assessment.ts
- Data Lineage — Phase 2
- reassess.py
- Data Flow Map — Phase 2 Audit
- start_db.py
- Backend — AI Interviewer FastAPI
- React + TypeScript + Vite
- rules/graphify.md
- .update_estimate
- Settings
- workflows/graphify.md
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `Base` - 24 edges
2. `delay()` - 20 edges
3. `compilerOptions` - 19 edges
4. `Data Lineage — Phase 2` - 18 edges
5. `submit_answer()` - 16 edges
6. `RoleCompetency` - 15 edges
7. `AssessmentSession` - 15 edges
8. `compilerOptions` - 15 edges
9. `SkillEstimate` - 14 edges
10. `get_report()` - 13 edges

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

## Communities (26 total, 4 thin omitted)

### Community 0 - "users.py"
Cohesion: 0.05
Nodes (53): app/config.py — Application configuration loaded from environment variables.…, Base, app/database.py — Async SQLAlchemy engine and session factory. All DB…, AnswerEvidence, QuestionAttempt, app/models/answer.py — QuestionAttempt and AnswerEvidence ORM models. Every…, Individual concept coverage item from LLM evaluation. Records whether a…, app/models/__init__.py — Exports all ORM models so Alembic can discover them. (+45 more)

### Community 1 - "sessions.py"
Cohesion: 0.06
Nodes (70): create_session(), _evidence_to_schema(), _generate_recommendations(), _generate_summary(), get_current_state(), get_report(), get_session(), _get_session_or_404() (+62 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (43): axios, framer-motion, lucide-react, oxlint, dependencies, axios, framer-motion, lucide-react (+35 more)

### Community 3 - "main.py"
Cohesion: 0.07
Nodes (28): _format_db_error_banner(), health(), lifespan(), get, websocket, app/main.py — FastAPI application entrypoint. Registers: - CORS middleware…, Real-time interview event stream. Handles: audio state, transcription,…, Formats a concise, actionable error banner when PostgreSQL is unreachable. (+20 more)

### Community 4 - "GraphitiService"
Cohesion: 0.10
Nodes (11): Any, GraphitiService, Records the initiation of an assessment session into the candidate's temporal…, Records candidate answer evidence for a specific concept tested by a question.…, Records a competency score transition in the user's temporal skill narrative.…, Records candidate progress on recommended improvement activities., Searches candidate contextual memory for relevant history, weaknesses, or prior…, Clean service abstraction for Graphiti temporal knowledge graph operations.… (+3 more)

### Community 5 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 6 - "App.tsx"
Cohesion: 0.05
Nodes (53): react, App(), queryClient, AdaptivePathDiagram(), Edge, edges, Node, nodes (+45 more)

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

### Community 11 - "types/assessment.ts"
Cohesion: 0.05
Nodes (65): actionLabels, AdaptiveStatePanel(), AdaptiveStatePanelProps, difficultyOrder, difficultyPosition(), LiveEstimatePanelProps, stateConfig, VoiceOrbProps (+57 more)

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

### Community 19 - ".update_estimate"
Cohesion: 0.33
Nodes (5): AsyncSession, Map numeric score to estimated level string., Update (or create) the skill estimate for a user/competency pair. Returns the…, _score_to_level(), SkillEstimate

## Knowledge Gaps
- **163 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+158 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GraphitiService` connect `GraphitiService` to `users.py`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `types/assessment.ts`, `plugins`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Base` connect `users.py` to `main.py`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Base` (e.g. with `lifespan()` and `seed()`) actually correct?**
  _`Base` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `submit_answer()` (e.g. with `AnswerEvidence` and `QuestionAttempt`) actually correct?**
  _`submit_answer()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _163 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `users.py` be split into smaller, more focused modules?**
  _Cohesion score 0.053703703703703705 - nodes in this community are weakly interconnected._