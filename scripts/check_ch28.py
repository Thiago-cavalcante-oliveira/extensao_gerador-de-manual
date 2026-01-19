import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check_ch28():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT id, title, status, video_url, stitched_video_url FROM chapters WHERE id = 28"))
        row = result.fetchone()
        if row:
            print(f"ID: {row[0]}")
            print(f"Title: {row[1]}")
            print(f"Status: {row[2]}")
            print(f"Video URL: {row[3]}")
            print(f"Stitched URL: {row[4]}")
        else:
            print("Chapter 28 not found.")

if __name__ == "__main__":
    asyncio.run(check_ch28())
