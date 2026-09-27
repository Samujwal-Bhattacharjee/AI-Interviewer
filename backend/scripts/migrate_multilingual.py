import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.database import engine

async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS interview_mode VARCHAR(32) DEFAULT 'standard';"))
        await conn.execute(text("ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS target_language VARCHAR(16) DEFAULT 'en-US';"))
    await engine.dispose()
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
