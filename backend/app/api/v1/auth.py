from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
import logging

from app.api.deps import get_db, get_current_user
from app.core.security import (
    verify_password, 
    create_access_token, 
    create_refresh_token,
    create_password_reset_token,
    verify_password_reset_token,
    get_password_hash
)
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserLogin, UserResponse
from app.schemas.auth import Token, PasswordResetRequest, PasswordResetConfirm

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information
    """
    return current_user

@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens
    """
    # Get user by username
    result = await db.execute(
        select(User).where(User.username == credentials.username)
    )
    user = result.scalar_one_or_none()
    
    # Verify user exists and password is correct
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": user.username, "user_id": str(user.id), "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.username, "user_id": str(user.id)}
    )
    
    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    await db.commit()
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    from app.core.security import verify_token
    
    try:
        payload = verify_token(refresh_token)
        
        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        username = payload.get("sub")
        
        # Get user
        result = await db.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        access_token = create_access_token(
            data={"sub": user.username, "user_id": str(user.id), "role": user.role.value}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": user.username, "user_id": str(user.id)}
        )
        
        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token"
        )

@router.post("/password-reset/request")
async def request_password_reset(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request a password reset token
    
    Accepts either email or username as the identifier.
    Sends a password reset token (in production, this would be emailed).
    For now, returns the token in the response for testing.
    """
    logger.info(f"Password reset requested for identifier: {request.identifier}")
    
    # Check if identifier is an email (contains @) or username
    if "@" in request.identifier:
        # Search by email
        result = await db.execute(
            select(User).where(User.email == request.identifier)
        )
    else:
        # Search by username
        result = await db.execute(
            select(User).where(User.username == request.identifier)
        )
    
    user = result.scalar_one_or_none()
    
    # Always return success to prevent user enumeration
    # But only generate token if user exists
    if user and user.is_active:
        reset_token = create_password_reset_token(str(user.id))
        logger.info(f"Password reset token generated for user: {user.username}")
        
        # TODO: In production, send this via email instead of returning it
        # For now, return it in the response for testing
        return {
            "message": "If the account exists, a password reset link has been sent",
            "reset_token": reset_token,  # Remove this in production!
            "note": "In production, this token would be sent via email",
            "user_email": user.email if user.email else None  # For testing
        }
    else:
        logger.warning(f"Password reset requested for non-existent/inactive identifier: {request.identifier}")
    
    return {
        "message": "If the account exists, a password reset link has been sent"
    }

@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using the reset token
    
    Validates the token and updates the user's password.
    """
    logger.info("Password reset confirmation attempt")
    
    # Verify the reset token
    user_id = verify_password_reset_token(reset_data.token)
    if not user_id:
        logger.warning("Invalid or expired password reset token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Find user by ID
    from uuid import UUID
    try:
        result = await db.execute(
            select(User).where(User.id == UUID(user_id))
        )
        user = result.scalar_one_or_none()
    except ValueError:
        logger.warning(f"Invalid user ID in token: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    if not user:
        logger.warning(f"User not found for ID: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        logger.warning(f"Password reset attempted for inactive user: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update password
    try:
        user.password_hash = get_password_hash(reset_data.new_password)
        await db.commit()
        logger.info(f"Password successfully reset for user: {user.username}")
        
        return {
            "message": "Password has been reset successfully",
            "username": user.username
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error resetting password: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )
