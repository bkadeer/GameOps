#!/usr/bin/env python3
"""
Test session creation with user_name
"""
import asyncio
import sys
from sqlalchemy import text, select
from app.core.database import engine
from app.models.session import Session
from app.models.payment import Payment

async def test_latest_records():
    print("🔍 Checking latest session and payment records...\n")
    
    async with engine.begin() as conn:
        # Get latest session
        result = await conn.execute(text("""
            SELECT 
                id::text,
                user_name,
                station_id::text,
                station_name,
                duration_minutes,
                created_at
            FROM sessions
            ORDER BY created_at DESC
            LIMIT 1
        """))
        session = result.fetchone()
        
        if session:
            print("📊 Latest Session:")
            print(f"  ID: {session[0][:8]}...")
            print(f"  User Name: '{session[1]}' (type: {type(session[1]).__name__})")
            print(f"  Station ID: {session[2][:8]}...")
            print(f"  Station Name: {session[3]}")
            print(f"  Duration: {session[4]} minutes")
            print(f"  Created: {session[5]}")
            
            if session[1] is None:
                print("  ⚠️  user_name is NULL")
            elif session[1] == '':
                print("  ⚠️  user_name is EMPTY STRING")
            else:
                print(f"  ✅ user_name has value: '{session[1]}'")
        else:
            print("  No sessions found")
        
        # Get latest payment
        print("\n💰 Latest Payment:")
        result = await conn.execute(text("""
            SELECT 
                id::text,
                user_name,
                station_id::text,
                amount,
                payment_method,
                created_at
            FROM payments
            ORDER BY created_at DESC
            LIMIT 1
        """))
        payment = result.fetchone()
        
        if payment:
            print(f"  ID: {payment[0][:8]}...")
            print(f"  User Name: '{payment[1]}' (type: {type(payment[1]).__name__})")
            print(f"  Station ID: {payment[2][:8] if payment[2] else 'NULL'}...")
            print(f"  Amount: ${payment[3]}")
            print(f"  Method: {payment[4]}")
            print(f"  Created: {payment[5]}")
            
            if payment[1] is None:
                print("  ⚠️  user_name is NULL")
            elif payment[1] == '':
                print("  ⚠️  user_name is EMPTY STRING")
            else:
                print(f"  ✅ user_name has value: '{payment[1]}'")
        else:
            print("  No payments found")

if __name__ == "__main__":
    asyncio.run(test_latest_records())
