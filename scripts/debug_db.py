
import asyncio
from app.db.session import AsyncSessionLocal
from app.models import Chapter
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        # Fetch the most recent failed chapter
        stmt = select(Chapter).where(Chapter.status == 'FAILED').order_by(Chapter.id.desc()).limit(1)
        result = await db.execute(stmt)
        chapter = result.scalar_one_or_none()
        
        if chapter:
            print(f"Chapter ID: {chapter.id}")
            print(f"Status: {chapter.status}")
            print(f"Content: {chapter.text_content}")
        else:
            print("No failed chapters found.")

if __name__ == "__main__":
    import sys
    # Add project root to path
    sys.path.append(".")
    asyncio.run(main())
