#!/usr/bin/env python3
"""
Clean up test sessions with duration < 15 minutes
"""

import asyncio
from sqlalchemy import select, delete
from app.core.database import AsyncSessionLocal
from app.models.session import Session

async def cleanup_test_sessions():
    """Delete sessions with duration < 15 minutes"""
    
    async with AsyncSessionLocal() as db:
        # Find test sessions
        result = await db.execute(
            select(Session).where(Session.duration_minutes < 15)
        )
        test_sessions = result.scalars().all()
        
        if not test_sessions:
            print("✅ No test sessions found")
            return
        
        print(f"Found {len(test_sessions)} test sessions:")
        for session in test_sessions:
            print(f"  - Session {session.id}: {session.duration_minutes} minutes, Status: {session.status}")
        
        # Delete them
        await db.execute(
            delete(Session).where(Session.duration_minutes < 15)
        )
        await db.commit()
        
        print(f"\n✅ Deleted {len(test_sessions)} test sessions")

if __name__ == "__main__":
    asyncio.run(cleanup_test_sessions())
