"""
Run database migration to add timestamps to sessions table
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def run_migration():
    """Apply timestamps migration to sessions table"""
    
    async with engine.begin() as conn:
        print("Running migration: Add timestamps to sessions...")
        
        # Add created_at column
        print("  - Adding created_at column...")
        await conn.execute(text("""
            ALTER TABLE sessions 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """))
        
        # Add updated_at column
        print("  - Adding updated_at column...")
        await conn.execute(text("""
            ALTER TABLE sessions 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """))
        
        # Create update function
        print("  - Creating update trigger function...")
        await conn.execute(text("""
            CREATE OR REPLACE FUNCTION update_sessions_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        """))
        
        # Drop existing trigger if exists
        print("  - Setting up trigger...")
        await conn.execute(text("""
            DROP TRIGGER IF EXISTS sessions_updated_at_trigger ON sessions
        """))
        
        # Create trigger
        await conn.execute(text("""
            CREATE TRIGGER sessions_updated_at_trigger
                BEFORE UPDATE ON sessions
                FOR EACH ROW
                EXECUTE FUNCTION update_sessions_updated_at()
        """))
        
        print("✅ Migration completed successfully!")
        
        # Verify the columns were added
        result = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sessions' 
            AND column_name IN ('created_at', 'updated_at')
            ORDER BY column_name
        """))
        
        rows = result.fetchall()
        if rows:
            print("\n✅ Verified columns:")
            for row in rows:
                print(f"  - {row[0]}: {row[1]}")
        else:
            print("⚠️  Warning: Could not verify column creation")

if __name__ == "__main__":
    asyncio.run(run_migration())
