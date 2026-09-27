"""
backend/scripts/migrate_db.py — Schema migration script for local development.

Adds missing columns to tables to keep existing databases in sync with SQLAlchemy models.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine


async def get_columns(table_name: str) -> list[dict]:
    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                """
                SELECT column_name, data_type, is_nullable, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = :table_name
                ORDER BY ordinal_position;
                """
            ),
            {"table_name": table_name},
        )
        return [dict(row._mapping) for row in result.fetchall()]


async def migrate() -> None:
    print("Checking 'assessment_sessions' columns before migration...")
    cols_before = await get_columns("assessment_sessions")
    print(f"Current columns ({len(cols_before)}): {[c['column_name'] for c in cols_before]}")

    has_column = any(c["column_name"] == "current_question_id" for c in cols_before)
    if not has_column:
        print("Adding column 'current_question_id' (VARCHAR(64), nullable)...")
        async with engine.begin() as conn:
            await conn.execute(
                text(
                    "ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS current_question_id VARCHAR(64);"
                )
            )
        print("[OK] Column added successfully.")
    else:
        print("[INFO] Column 'current_question_id' already exists.")

    print("\nVerifying 'assessment_sessions' columns after migration:")
    cols_after = await get_columns("assessment_sessions")
    for c in cols_after:
        print(f"  - {c['column_name']}: {c['data_type']}" + (f"({c['character_maximum_length']})" if c['character_maximum_length'] else "") + f", nullable={c['is_nullable']}")

    assert any(c["column_name"] == "current_question_id" for c in cols_after), "Verification failed: current_question_id not found!"
    print("\n[SUCCESS] Migration verified.")


if __name__ == "__main__":
    asyncio.run(migrate())
