#!/usr/bin/env python3
"""
Quick script to generate a new agent token for a station
Usage: python generate_agent_token.py
"""

import asyncio
import sys
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.station import Station
from app.core.security import create_agent_token

async def generate_token():
    """Generate new agent token for PC-1 station"""
    
    station_id = "8d1bf804-8bf4-4e95-be9e-3a818627895c"
    
    async with AsyncSessionLocal() as db:
        # Get station
        result = await db.execute(
            select(Station).where(Station.id == station_id)
        )
        station = result.scalar_one_or_none()
        
        if not station:
            print(f"❌ Station not found: {station_id}")
            sys.exit(1)
        
        # Generate new token (valid for 365 days)
        new_token = create_agent_token(str(station_id), expires_days=365)
        
        print("=" * 80)
        print(f"✅ New Agent Token Generated for: {station.name}")
        print("=" * 80)
        print(f"\nStation ID: {station_id}")
        print(f"Station Name: {station.name}")
        print(f"Expires: 365 days from now")
        print(f"\n{'=' * 80}")
        print("NEW TOKEN:")
        print("=" * 80)
        print(new_token)
        print("=" * 80)
        print("\n📋 Update Windows config.yaml with:")
        print("\nbackend:")
        print(f"  token: {new_token}")
        print("\n" + "=" * 80)

if __name__ == "__main__":
    asyncio.run(generate_token())
