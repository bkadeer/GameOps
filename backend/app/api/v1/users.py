from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
import logging

from app.api.deps import get_db, get_current_admin, get_current_user
from app.models.user import User, Role
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import get_password_hash

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    List all users (Admin only)
    """
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new user (Admin only)
    
    Requirements:
    - username: 3-100 characters, no spaces recommended
    - password: min 8 chars, must contain uppercase, lowercase, and digit
    - role: ADMIN, STAFF, or CUSTOMER
    - membership_tier: only for CUSTOMER role (BASIC, PREMIUM, VIP)
    - email: optional but must be unique if provided
    """
    logger.info(f"Creating user: {user_data.username} with role: {user_data.role}")
    
    # Validate username format
    if " " in user_data.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot contain spaces. Use underscores or hyphens instead."
        )
    
    # Validate membership tier usage
    if user_data.membership_tier and user_data.role != Role.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"membership_tier can only be set for CUSTOMER role, not {user_data.role}"
        )
    
    # Check if username exists
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        logger.warning(f"Username already exists: {user_data.username}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{user_data.username}' already exists"
        )
    
    # Check if email exists
    if user_data.email:
        result = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            logger.warning(f"Email already exists: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{user_data.email}' already exists"
            )
    
    # Create user - wrap in try/except to catch database errors
    try:
        user_dict = user_data.model_dump(exclude={"password"})
        user = User(
            **user_dict,
            password_hash=get_password_hash(user_data.password)
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"User created successfully: {user.username} (ID: {user.id})")
        return user
        
    except Exception as e:
        # Rollback on any database errors
        await db.rollback()
        logger.error(f"Database error creating user: {str(e)}", exc_info=True)
        
        # Check if it's a unique constraint violation
        error_msg = str(e).lower()
        if "unique" in error_msg or "duplicate" in error_msg:
            if "username" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Username '{user_data.username}' already exists"
                )
            elif "email" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Email '{user_data.email}' already exists"
                )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get user by ID (Admin only)
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.put("/{user_id}/password", response_model=UserResponse)
async def reset_user_password(
    user_id: UUID,
    password_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reset user password
    - Users can reset their own password
    - Admins can reset any user's password
    
    Request body: {"password": "new_password"}
    """
    password = password_data.get('password')
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required"
        )
    
    # Validate password
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check permissions: user can reset their own password, or must be admin
    if user.id != current_user.id and current_user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reset your own password"
        )
    
    # Update password
    user.password_hash = get_password_hash(password)
    await db.commit()
    await db.refresh(user)
    
    if user.id == current_user.id:
        logger.info(f"User {user.username} reset their own password")
    else:
        logger.info(f"Password reset for user: {user.username} by admin: {current_user.username}")
    return user

@router.put("/{user_id}/toggle-status", response_model=UserResponse)
async def toggle_user_status(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Enable/Disable user account (Admin only)
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent disabling yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot disable your own account"
        )
    
    # Toggle status
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    
    status_text = "enabled" if user.is_active else "disabled"
    logger.info(f"User {user.username} {status_text} by admin: {current_user.username}")
    return user
