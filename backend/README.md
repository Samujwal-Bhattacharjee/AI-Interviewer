# Backend — AI Interviewer FastAPI

This is the backend service for the Adaptive AI Mock Interview application.
It acts as the authoritative source of truth for all interview state, adaptive question progression, LLM evaluation, TTS audio generation, and final diagnostic reporting.

---

## 1. Setup Python Environment

From the project root:

```bash
cd backend
python3 -m venv .venv

# Activate on Linux / macOS:
source .venv/bin/activate

# Activate on Windows:
.venv\Scripts\activate
```

---

## 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install pgserver  # Embedded PostgreSQL for zero-config local development
```

---

## 3. Database Setup (PostgreSQL)

The application uses PostgreSQL with async SQLAlchemy (`asyncpg`).

**Option A (Embedded Postgres — Recommended for Local Dev):**
```bash
python scripts/start_db.py          # Starts PostgreSQL on localhost:5432
python scripts/start_db.py status   # Verify it's running
python scripts/start_db.py stop     # Stop server when done
```

**Option B (Docker):**
```bash
docker run -d --name aiinterview-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aiinterviewer postgres:16
```

**Option C (Existing Local or Cloud Postgres):**
Provide your connection string in `backend/.env`.

---

## 4. Configure Environment Variables

Create `backend/.env` from `.env.example`:

```bash
cp .env.example .env
```

Configure your credentials:

```ini
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/aiinterviewer

# LLM Configuration (supports Groq, OpenAI, Together, OpenRouter, Ollama)
LLM_API_KEY=your_llm_api_key_here
LLM_MODEL=llama-3.3-70b-versatile
LLM_BASE_URL=https://api.groq.com/openai/v1

# Alternatively for OpenAI:
# LLM_API_KEY=sk-proj-...
# LLM_MODEL=gpt-4o-mini
# LLM_BASE_URL=https://api.openai.com/v1

# Text-to-Speech (TTS) — ElevenLabs or OpenAI TTS
TTS_API_KEY=your_tts_key_here
TTS_MODEL=eleven_turbo_v2_5
TTS_VOICE=21m00Tcm4TlvDq8ikWAM

# Server
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
DEBUG=true
```

> **Note on Voice & LLM Fallback:**
> - If `LLM_API_KEY` is not provided, the backend uses a deterministic question bank and keyword semantic evaluation for zero-cost offline testing.
> - If `TTS_API_KEY` is not provided, the `/api/voice/tts` endpoint returns HTTP 503, and the frontend automatically falls back to browser `SpeechSynthesis`, ensuring voice interviews always work without interruption.

---

## 5. Seed the Database

Populate target roles, competencies, questions, and the default user:

```bash
python scripts/seed_db.py
```

---

## 6. Start the FastAPI Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation (Swagger UI):** http://localhost:8000/docs
- **Alternative Documentation (ReDoc):** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

---

## 7. Start the Frontend in API Mode

In a separate terminal, from the project root:

Create or edit `.env` in the root directory:
```ini
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_DATA_MODE=api
```

Start Vite dev server:
```bash
npm run dev
```

Visit http://localhost:5173 to begin an adaptive interview session.

---

## 8. Run Verification Tests

Run the comprehensive integration test suite to verify the end-to-end slice:

```bash
python scripts/test_endpoints.py
python scripts/test_e2e_interview.py
```

---

## Architecture Overview

```
backend/
├── app/
│   ├── main.py                     # FastAPI entrypoint & CORS middleware
│   ├── config.py                   # Pydantic Settings loaded from .env
│   ├── database.py                 # Async SQLAlchemy engine & session dependency
│   ├── models/                     # SQLAlchemy ORM models
│   │   ├── session.py              # AssessmentSession & adaptive state
│   │   ├── question.py             # Questions & expected concepts
│   │   ├── answer.py               # QuestionAttempt & AnswerEvidence
│   │   ├── role.py                 # Role & Competency requirements
│   │   ├── skill.py                # SkillEstimate & SkillHistory
│   │   └── user.py                 # User
│   ├── schemas/                    # Pydantic validation & OpenAPI contracts
│   ├── routers/                    # Route handlers
│   │   ├── sessions.py             # /api/sessions/* (start, next, answers, report)
│   │   ├── roles.py                # /api/roles/*
│   │   ├── users.py                # /api/users/* (skills, gaps, stats, plan)
│   │   ├── voice.py                # /api/voice/tts (streaming audio)
│   │   └── reassess.py             # /api/reassess
│   └── services/                   # Business logic
│       ├── llm_service.py          # Unified LLM question & evaluation service
│       ├── adaptive_engine.py      # Binary-search adaptive difficulty engine
│       ├── answer_evaluator.py     # Evaluation with semantic fallback
│       ├── skill_estimator.py      # Bayesian-style score & confidence updates
│       ├── voice_service.py        # ElevenLabs & OpenAI TTS streaming
│       └── course_recommendation_service.py # Curated learning recommendations
├── scripts/
│   ├── start_db.py                 # Embedded PostgreSQL daemon runner
│   ├── seed_db.py                  # Database initial seeder
│   ├── test_endpoints.py           # Endpoint validation test
│   └── test_e2e_interview.py       # End-to-end full interview lifecycle test
├── requirements.txt
├── .env.example
└── README.md
```
