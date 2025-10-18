"""
Run database migration for soft delete
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def run_migration():
    """Apply soft delete migration"""
    
    async with engine.begin() as conn:
        print("Running migration: Add soft delete to stations...")
        
        # Execute statements separately
        print("  - Adding deleted_at column...")
        await conn.execute(text("""
            ALTER TABLE stations 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
        """))
        
        print("  - Creating index...")
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_stations_deleted_at ON stations(deleted_at)
        """))
        
        print("✅ Migration completed successfully!")
        
        # Verify the column was added
        result = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'stations' AND column_name = 'deleted_at'
        """))
        row = result.fetchone()
        if row:
            print(f"✅ Verified: Column 'deleted_at' exists with type '{row[1]}'")
        else:
            print("⚠️  Warning: Could not verify column creation")

if __name__ == "__main__":
    asyncio.run(run_migration())
