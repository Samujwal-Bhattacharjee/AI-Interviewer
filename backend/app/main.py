"""
app/main.py — FastAPI application entrypoint.

Registers:
  - CORS middleware (frontend origins from env)
  - All routers (roles, sessions, users, reassess)
  - WebSocket endpoint (/ws/sessions/{session_id})
  - Lifespan: DB table creation on startup

OpenAPI docs: GET /docs
ReDoc: GET /redoc
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import sys

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import roles, sessions, users, reassess
from app.services.graphiti_service import graphiti_service
from app.ws.session_ws import handle_session_ws


def _format_db_error_banner(db_url: str) -> str:
    """Formats a concise, actionable error banner when PostgreSQL is unreachable."""
    display_url = db_url
    if "@" in display_url and ":" in display_url.split("@")[0]:
        prefix, host_part = display_url.split("@", 1)
        parts = prefix.split(":")
        if len(parts) >= 3:
            display_url = f"{parts[0]}:{parts[1]}:***@{host_part}"

    return (
        "\n"
        + "=" * 60 + "\n"
        + "POSTGRESQL CONNECTION FAILED\n"
        + "=" * 60 + "\n"
        + f"Expected:\n  {display_url}\n\n"
        + "Make sure PostgreSQL is running and the database exists.\n\n"
        + "Options to start PostgreSQL:\n"
        + "  1. Windows local development:\n"
        + "     python scripts/start_db.py\n"
        + "  2. Windows PostgreSQL Service:\n"
        + "     net start postgresql-x64-16 (or start via Services app)\n"
        + "  3. Docker:\n"
        + "     docker run -d --name aiinterview-postgres -p 5432:5432 \\\n"
        + "       -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aiinterviewer postgres:16\n"
        + "  4. Supabase / Cloud Postgres:\n"
        + "     Set DATABASE_URL in backend/.env\n"
        + "=" * 60 + "\n"
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Create all tables on startup and initialize services."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception:
        sys.stderr.write(_format_db_error_banner(settings.database_url))
        sys.stderr.flush()
        raise SystemExit(1) from None

    # Initialize Graphiti context layer (non-blocking, fails gracefully if not configured)
    await graphiti_service.initialize()

    yield

    # Teardown
    await graphiti_service.close()
    await engine.dispose()


app = FastAPI(
    title="ADAPTIVE — AI Interviewer API",
    description=(
        "Backend API for the Adaptive Assessment Engine. "
        "All assessment decisions (question selection, difficulty, scoring) happen here. "
        "Frontend is a visualization layer only."
    ),
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow the frontend dev server and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP routers
app.include_router(roles.router)
app.include_router(sessions.router)
app.include_router(users.router)
app.include_router(reassess.router)


# WebSocket endpoint
@app.websocket("/ws/sessions/{session_id}")
async def websocket_session(session_id: str, websocket: WebSocket) -> None:
    """
    Real-time interview event stream.
    Handles: audio state, transcription, evaluation, skill updates.
    """
    await handle_session_ws(session_id, websocket)


# Health check
@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "version": "0.2.0"}


@app.get("/", tags=["health"])
async def root() -> dict:
    return {
        "service": "ADAPTIVE API",
        "docs": "/docs",
        "version": "0.2.0",
    }
