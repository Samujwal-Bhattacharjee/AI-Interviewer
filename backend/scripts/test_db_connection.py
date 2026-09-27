"""
backend/scripts/test_db_connection.py — Diagnostic script to test PostgreSQL connection
without exposing secrets.
"""
import asyncio
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.config import settings

def print_sanitized_config():
    url = settings.database_url
    # Strip driver prefix if any
    clean_url = url.replace("postgresql+asyncpg://", "postgresql://")
    parsed = urlparse(clean_url)
    print("========================================")
    print("DATABASE CONFIGURATION:")
    print("========================================")
    print(f"DATABASE DRIVER = postgresql+asyncpg")
    print(f"DATABASE HOST   = {parsed.hostname}")
    print(f"DATABASE PORT   = {parsed.port}")
    print(f"DATABASE USER   = {parsed.username}")
    print(f"DATABASE NAME   = {parsed.path.lstrip('/')}")
    print("DATABASE PASS   = [HIDDEN]")
    print(f"ENV FILE LOADED = {settings.model_config.get('env_file')}")
    print("========================================")

async def test_asyncpg():
    import asyncpg
    url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
    parsed = urlparse(url)
    
    print("\n[1/3] Testing raw asyncpg connection to host and port...")
    try:
        # First connect to default postgres db
        conn = await asyncpg.connect(
            user=parsed.username,
            password=parsed.password,
            host=parsed.hostname,
            port=parsed.port or 5432,
            database="postgres",
            timeout=5,
        )
        print(" -> SUCCESS: Connected to postgres server (default 'postgres' db)")
        
        # Check databases
        rows = await conn.fetch("SELECT datname FROM pg_database WHERE datistemplate = false;")
        db_names = [r["datname"] for r in rows]
        print(f" -> Existing databases: {db_names}")
        target_db = parsed.path.lstrip('/')
        if target_db in db_names:
            print(f" -> Target database '{target_db}' EXISTS!")
        else:
            print(f" -> WARNING: Target database '{target_db}' DOES NOT EXIST!")
        await conn.close()
    except Exception as e:
        print(f" -> FAILED connecting to 'postgres' db: {type(e).__name__}: {e}")

    print(f"\n[2/3] Testing asyncpg connection directly to '{parsed.path.lstrip('/')}'...")
    try:
        conn = await asyncpg.connect(
            user=parsed.username,
            password=parsed.password,
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path.lstrip('/'),
            timeout=5,
        )
        val = await conn.fetchval("SELECT 1;")
        print(f" -> SUCCESS: Connected to '{parsed.path.lstrip('/')}', SELECT 1 returned {val}")
        await conn.close()
    except Exception as e:
        print(f" -> FAILED connecting to '{parsed.path.lstrip('/')}': {type(e).__name__}: {e}")

async def test_sqlalchemy():
    print("\n[3/4] Testing SQLAlchemy AsyncEngine from app.database...")
    try:
        from app.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1;"))
            row = result.scalar()
            print(f" -> SUCCESS: SQLAlchemy engine connected, SELECT 1 = {row}")
    except Exception as e:
        print(f" -> FAILED SQLAlchemy connection: {type(e).__name__}: {e}")

async def test_schema():
    print("\n[4/4] Testing database schema and required columns...")
    try:
        from app.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            # Check assessment_sessions columns
            res = await conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'assessment_sessions';"
            ))
            cols = [r[0] for r in res.fetchall()]
            print(f" -> assessment_sessions columns count: {len(cols)}")
            for req_col in ["id", "user_id", "target_role_id", "current_question_id", "interview_mode", "target_language"]:
                if req_col in cols:
                    print(f"    [OK] Column '{req_col}' is present")
                else:
                    print(f"    [FAIL] Column '{req_col}' is MISSING!")

            # Check tables exist
            res = await conn.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
            ))
            tables = [r[0] for r in res.fetchall()]
            print(f" -> Existing tables: {tables}")
    except Exception as e:
        print(f" -> FAILED schema test: {type(e).__name__}: {e}")

async def main():
    print_sanitized_config()
    await test_asyncpg()
    await test_sqlalchemy()
    await test_schema()

if __name__ == "__main__":
    asyncio.run(main())
