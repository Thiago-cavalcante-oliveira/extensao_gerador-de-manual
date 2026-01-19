import os
import asyncio
from sqlalchemy import text
from  sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

load_dotenv()

async def check():
    # Use localhost if running outside docker targeting exposure
    # If inside docker, use POSTGRES_HOST from env
    # Since we run this from host, override host to localhost
    
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "fozdocs")
    host = "localhost" 
    
    url = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db_name}"
    
    print(f"Connecting to {url}...")
    try:
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            print("Connected!")
            
            # Check columns in chapters
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='chapters'"))
            cols = [r[0] for r in res.fetchall()]
            print(f"Chapters columns: {cols}")
            
            req_chapters = ['audience', 'functionality', 'stitched_video_url']
            missing_c = [c for c in req_chapters if c not in cols]
            
            # Check columns in configurations
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='configurations'"))
            cols_conf = [r[0] for r in res.fetchall()]
            print(f"Configurations columns: {cols_conf}")
            
            req_conf = ['intro_video_url', 'outro_video_url']
            missing_conf = [c for c in req_conf if c not in cols_conf]
            
            # Check favorites table
            res = await conn.execute(text("SELECT to_regclass('public.favorites')"))
            has_favorites = res.scalar() is not None
            print(f"Has favorites table: {has_favorites}")

            if not missing_c and not missing_conf and has_favorites:
                print("VERIFICATION SUCCESS: All columns and tables exist.")
            else:
                print(f"VERIFICATION FAILED. Missing: Chapter={missing_c}, Config={missing_conf}, Fav={not has_favorites}")
                
    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    asyncio.run(check())
