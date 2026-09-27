import asyncio, sys
sys.path.insert(0, '.')
from app.database import engine
from sqlalchemy import text

async def run():
    async with engine.begin() as conn:
        r = await conn.execute(text("""
            SELECT competency_id, difficulty, COUNT(*) as count 
            FROM questions WHERE is_active = true 
            GROUP BY competency_id, difficulty 
            ORDER BY competency_id, difficulty
        """))
        rows = r.fetchall()
        print(f"{'Competency':<25} {'Difficulty':<15} {'Count':<5}")
        print("-" * 45)
        for row in rows:
            print(f"{row[0]:<25} {row[1]:<15} {row[2]:<5}")
        
        total = await conn.execute(text("SELECT COUNT(*) FROM questions WHERE is_active = true"))
        print(f"\nTotal active questions: {total.scalar()}")

asyncio.run(run())
