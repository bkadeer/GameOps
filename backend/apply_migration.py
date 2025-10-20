#!/usr/bin/env python3
"""
Apply database migration script
"""
import asyncio
import sys
from pathlib import Path
from sqlalchemy import text
from app.core.database import engine

async def apply_migration(migration_file: str):
    """Apply a SQL migration file"""
    
    # Read the migration file
    migration_path = Path(migration_file)
    if not migration_path.exists():
        print(f"❌ Migration file not found: {migration_file}")
        sys.exit(1)
    
    print(f"📄 Reading migration: {migration_path.name}")
    sql_content = migration_path.read_text()
    
    # Remove comment lines and split into statements
    lines = []
    for line in sql_content.split('\n'):
        # Skip comment-only lines
        if line.strip().startswith('--'):
            continue
        lines.append(line)
    
    clean_sql = '\n'.join(lines)
    
    # Split into individual statements by semicolon
    statements = [s.strip() for s in clean_sql.split(';') if s.strip()]
    
    print(f"📝 Found {len(statements)} SQL statements")
    print("🔄 Applying migration...\n")
    
    async with engine.begin() as conn:
        for i, statement in enumerate(statements, 1):
            # Skip comment-only statements
            if statement.startswith('--'):
                continue
                
            try:
                print(f"[{i}/{len(statements)}] Executing...")
                # Show first 80 chars of statement
                preview = statement[:80].replace('\n', ' ')
                print(f"    {preview}...")
                
                await conn.execute(text(statement))
                print(f"    ✅ Success\n")
                
            except Exception as e:
                print(f"    ❌ Error: {e}\n")
                print(f"Statement was:\n{statement}\n")
                raise
    
    print("✅ Migration applied successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python apply_migration.py <migration_file.sql>")
        print("\nExample:")
        print("  python apply_migration.py migrations/add_station_to_payments_and_username_to_sessions.sql")
        sys.exit(1)
    
    migration_file = sys.argv[1]
    asyncio.run(apply_migration(migration_file))
