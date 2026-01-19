import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.models.user import User

async def debug_db():
    async with engine.begin() as conn:
        print("Checking Users...")
        result = await conn.execute(text("SELECT id, email FROM users WHERE id = 1"))
        user = result.fetchone()
        if user:
            print(f"User ID 1 exists: {user}")
        else:
            print("User ID 1 DOES NOT EXIST. Creating...")
            await conn.execute(text("INSERT INTO users (id, email, hashed_password, role, is_active, full_name) VALUES (1, 'admin@fozdocs.com', 'hash_placeholder', 'admin', true, 'Admin User')"))
            print("User ID 1 created.")
            
        print("Checking Favorites Table...")
        try:
             await conn.execute(text("SELECT * FROM favorites LIMIT 1"))
             print("Favorites table exists and is accessible.")
        except Exception as e:
             print(f"Error accessing favorites: {e}")

if __name__ == "__main__":
    asyncio.run(debug_db())
