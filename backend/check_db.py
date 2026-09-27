import asyncio
import sys
sys.path.insert(0, '.')
from app.database import engine
from sqlalchemy import text

async def run():
    async with engine.begin() as conn:
        r = await conn.execute(text("SELECT id FROM users LIMIT 5"))
        rows = r.fetchall()
        print("Users:", rows)
        r2 = await conn.execute(text("SELECT id FROM assessment_sessions WHERE user_id='user-001' LIMIT 2"))
        print("Sessions with user-001:", r2.fetchall())

asyncio.run(run())
