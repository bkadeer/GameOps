#!/usr/bin/env python3
"""
Initialize database with tables and seed data
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine, Base
from app.core.security import get_password_hash
from app.models import Station, Session, User, Payment, Event
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables created successfully")

async def create_admin_user():
    """Create default admin user"""
    print("Creating admin user...")
    
    from app.core.database import AsyncSessionLocal
    from app.models.user import Role
    
    async with AsyncSessionLocal() as session:
        # Check if admin exists
        result = await session.execute(
            select(User).where(User.username == "admin")
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print("⚠ Admin user already exists")
            return
        
        # Create admin user
        admin = User(
            username="admin",
            email="admin@venue.local",
            password_hash=get_password_hash("changeme"),
            full_name="System Administrator",
            role=Role.ADMIN,
            is_active=True
        )
        
        session.add(admin)
        await session.commit()
        print("✓ Admin user created (username: admin, password: changeme)")

async def create_sample_stations():
    """Create sample stations for testing"""
    print("Creating sample stations...")
    
    from app.core.database import AsyncSessionLocal
    from app.models.station import StationType, ControlMethod, StationStatus
    
    async with AsyncSessionLocal() as session:
        # Check if stations exist
        result = await session.execute(select(Station))
        existing = result.scalars().all()
        
        if existing:
            print(f"⚠ {len(existing)} stations already exist")
            return
        
        # Create sample PC stations
        for i in range(1, 6):
            station = Station(
                name=f"PC-{i:02d}",
                station_type=StationType.PC,
                location=f"Floor 1, Row A, Seat {i}",
                ip_address=f"192.168.20.{10+i}",
                mac_address=f"00:11:22:33:44:{i:02x}",
                control_method=ControlMethod.AGENT,
                status=StationStatus.OFFLINE,
                specs={
                    "cpu": "Intel Core i7-12700K",
                    "gpu": "NVIDIA RTX 3080",
                    "ram_gb": 32,
                    "storage_gb": 1000
                }
            )
            session.add(station)
        
        # Create sample console stations
        consoles = [
            ("PS5-01", StationType.PS5),
            ("PS5-02", StationType.PS5),
            ("XBOX-01", StationType.XBOX),
            ("SWITCH-01", StationType.SWITCH),
        ]
        
        for i, (name, console_type) in enumerate(consoles, start=1):
            station = Station(
                name=name,
                station_type=console_type,
                location=f"Floor 1, Console Area, Station {i}",
                ip_address=f"192.168.30.{10+i}",
                mac_address=f"00:22:33:44:55:{i:02x}",
                control_method=ControlMethod.SMART_PLUG,
                control_address=f"192.168.50.{10+i}",
                status=StationStatus.OFFLINE
            )
            session.add(station)
        
        await session.commit()
        print(f"✓ Created 9 sample stations (5 PCs, 4 consoles)")

async def main():
    """Main initialization function"""
    print("=" * 60)
    print("EVMS Database Initialization")
    print("=" * 60)
    
    try:
        await create_tables()
        await create_admin_user()
        await create_sample_stations()
        
        print("=" * 60)
        print("✓ Database initialization complete!")
        print("=" * 60)
        print("\nYou can now:")
        print("1. Start the backend: uvicorn app.main:app --reload")
        print("2. Login with: username=admin, password=changeme")
        print("3. Access API docs: http://localhost:8000/api/docs")
        
    except Exception as e:
        print(f"✗ Error during initialization: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
