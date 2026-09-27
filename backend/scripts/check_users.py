import asyncio
from app.database import engine
from sqlalchemy import text

async def run():
    async with engine.begin() as conn:
        r = await conn.execute(text("SELECT id, email FROM users LIMIT 5"))
        rows = r.fetchall()
        print("Users:", rows)

asyncio.run(run())
