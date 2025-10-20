#!/usr/bin/env python3
"""Verify migration was applied successfully"""
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def verify():
    print("🔍 Verifying migration...\n")
    
    async with engine.begin() as conn:
        # Check payments table
        print("📊 Payments table columns:")
        result = await conn.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'payments' 
            ORDER BY ordinal_position
        """))
        for row in result:
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]})")
        
        print("\n📊 Sessions table columns:")
        result = await conn.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'sessions' 
            ORDER BY ordinal_position
        """))
        for row in result:
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]})")
        
        # Check if user_id is gone and user_name exists
        result = await conn.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'sessions' AND column_name = 'user_id'
            )
        """))
        has_user_id = result.scalar()
        
        result = await conn.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'sessions' AND column_name = 'user_name'
            )
        """))
        has_user_name = result.scalar()
        
        result = await conn.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'payments' AND column_name = 'station_id'
            )
        """))
        has_station_id = result.scalar()
        
        print("\n✅ Migration Status:")
        print(f"  - Sessions has user_name: {'✅ YES' if has_user_name else '❌ NO'}")
        print(f"  - Sessions has user_id: {'❌ STILL EXISTS' if has_user_id else '✅ REMOVED'}")
        print(f"  - Payments has station_id: {'✅ YES' if has_station_id else '❌ NO'}")
        
        if has_user_name and not has_user_id and has_station_id:
            print("\n🎉 Migration applied successfully!")
        else:
            print("\n⚠️  Migration incomplete or failed")

if __name__ == "__main__":
    asyncio.run(verify())
