# Backend — AI Interviewer FastAPI

## Setup

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

## Environment & Database

### 1. Database Setup (PostgreSQL required)

The backend requires a PostgreSQL database (PostgreSQL is the structured application source of truth).

**Option A (Recommended for Windows local development):**
```bash
python scripts/start_db.py          # Starts PostgreSQL on port 5432 and creates 'aiinterviewer' db
python scripts/start_db.py status   # Checks status
python scripts/start_db.py stop     # Stops the server
```

**Option B (Docker):**
```bash
docker run -d --name aiinterview-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aiinterviewer postgres:16
```

**Option C (Native Windows PostgreSQL Service):**
Start the service via `services.msc` or `net start postgresql-x64-16`.

**Option D (Cloud / Supabase):**
Configure `DATABASE_URL` in `backend/.env`.

### 2. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default connection string:
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/aiinterviewer
```

### 3. Seed Database

Run the seed script to populate competencies, roles, questions, and default user:
```bash
python scripts/seed_db.py
```

## Graphiti & Neo4j (Contextual Layer)

Graphiti (`graphiti-core`) provides the temporal knowledge graph layer.
The backend starts and operates normally without Graphiti if Neo4j is unconfigured.

To enable Graphiti:
1. Provide `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` in `backend/.env`.
2. Provide `OPENAI_API_KEY` for entity extraction and embeddings.

## Run Backend

```bash
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Structure

```
backend/
  app/
    main.py          - FastAPI app, routers, CORS
    config.py        - Settings from environment
    database.py      - SQLAlchemy async engine
    models/          - SQLAlchemy ORM models (DB tables)
    schemas/         - Pydantic request/response schemas
    routers/         - FastAPI route handlers
    services/        - Business logic
    ws/              - WebSocket handlers
  alembic/           - DB migrations
  requirements.txt
  .env.example
```
