"""
Script to reset admin password
Usage: python reset_admin_password.py
"""
import asyncio
import sys
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def reset_admin_password():
    """Reset admin user password"""
    
    # Get username and new password
    username = input("Enter admin username (default: admin): ").strip() or "admin"
    new_password = input("Enter new password (min 8 chars, must have uppercase, lowercase, digit): ").strip()
    
    # Validate password
    if len(new_password) < 8:
        print("❌ Password must be at least 8 characters")
        return
    if not any(c.isupper() for c in new_password):
        print("❌ Password must contain at least one uppercase letter")
        return
    if not any(c.islower() for c in new_password):
        print("❌ Password must contain at least one lowercase letter")
        return
    if not any(c.isdigit() for c in new_password):
        print("❌ Password must contain at least one digit")
        return
    
    async with AsyncSessionLocal() as session:
        # Find user
        result = await session.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User '{username}' not found")
            return
        
        # Update password
        user.password_hash = get_password_hash(new_password)
        await session.commit()
        
        print(f"✅ Password reset successfully for user: {username}")
        print(f"   User ID: {user.id}")
        print(f"   Role: {user.role}")
        print(f"   You can now login with the new password")

if __name__ == "__main__":
    try:
        asyncio.run(reset_admin_password())
    except KeyboardInterrupt:
        print("\n❌ Cancelled")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
