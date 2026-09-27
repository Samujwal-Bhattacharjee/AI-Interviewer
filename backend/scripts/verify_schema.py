"""
backend/scripts/verify_schema.py — Verifies current_question_id column in assessment_sessions.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine


async def verify():
    async with engine.connect() as conn:
        res = await conn.execute(
            text(
                """
                SELECT column_name, data_type, is_nullable, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = 'assessment_sessions'
                ORDER BY ordinal_position;
                """
            )
        )
        rows = res.fetchall()
        print("Columns in 'assessment_sessions':")
        col_names = []
        for r in rows:
            print(f"  {r[0]}: {r[1]} (nullable={r[2]}, max_length={r[3]})")
            col_names.append(r[0])

        assert "current_question_id" in col_names, "current_question_id MISSING!"
        print("\n[VERIFIED] column 'current_question_id' exists in 'assessment_sessions'!")


if __name__ == "__main__":
    asyncio.run(verify())
