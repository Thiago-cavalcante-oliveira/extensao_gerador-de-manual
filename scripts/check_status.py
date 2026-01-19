import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check_status():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT id, title, status FROM chapters"))
        rows = result.fetchall()
        print(f"Total Chapters: {len(rows)}")
        for r in rows:
            print(f"ID: {r[0]} | Title: {r[1]} | Status: {r[2]}")

if __name__ == "__main__":
    asyncio.run(check_status())
