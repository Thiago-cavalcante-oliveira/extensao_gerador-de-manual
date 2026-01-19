import asyncio
from sqlalchemy import text
from app.db.session import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating Database Schema for Viewer Features...")
        
        # 1. Add columns to 'chapters'
        try:
            await conn.execute(text("ALTER TABLE chapters ADD COLUMN audience VARCHAR(200)"))
            print("Added 'audience' to chapters.")
        except Exception as e:
            print(f"Skipped 'audience' (probably exists): {e}")

        try:
            await conn.execute(text("ALTER TABLE chapters ADD COLUMN functionality VARCHAR(100)"))
            print("Added 'functionality' to chapters.")
        except Exception as e:
            print(f"Skipped 'functionality': {e}")
            
        try:
            await conn.execute(text("ALTER TABLE chapters ADD COLUMN stitched_video_url VARCHAR(500)"))
            print("Added 'stitched_video_url' to chapters.")
        except Exception as e:
            print(f"Skipped 'stitched_video_url': {e}")
            
        # 2. Add columns to 'configurations'
        try:
            await conn.execute(text("ALTER TABLE configurations ADD COLUMN intro_video_url VARCHAR"))
            print("Added 'intro_video_url' to configurations.")
        except Exception as e:
            print(f"Skipped 'intro_video_url': {e}")

        try:
            await conn.execute(text("ALTER TABLE configurations ADD COLUMN outro_video_url VARCHAR"))
            print("Added 'outro_video_url' to configurations.")
        except Exception as e:
            print(f"Skipped 'outro_video_url': {e}")
            
        # 3. Create 'favorites' table (Base.metadata.create_all handles this if the table doesn't exist, 
        # but let's leave it to init_db.py on startup, effectively handled by main.py)
        
        print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())
