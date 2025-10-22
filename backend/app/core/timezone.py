"""
Timezone Utilities
Centralized timezone management for the application

IMPORTANT: This application uses a HARDCODED timezone approach (not geolocation)
because the gaming center operates from a SINGLE PHYSICAL LOCATION.

Architecture:
- Database: Stores all timestamps in UTC (universal standard)
- Backend: Converts UTC to local timezone (CST) for analytics/display
- Frontend: Receives UTC timestamps and displays in user's browser timezone

To change the timezone:
1. Update DEFAULT_TIMEZONE below (e.g., 'America/New_York', 'Europe/London')
2. Restart the backend server
3. All analytics and displays will automatically use the new timezone

Valid timezone strings: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
import pytz

# Default timezone for the gaming center location
# Change this if you move to a different timezone
DEFAULT_TIMEZONE = 'America/Chicago'  # CST/CDT (UTC-6/-5)

def get_app_timezone() -> pytz.timezone:
    """
    Get the application's timezone
    
    Returns:
        pytz timezone object for the configured timezone
    """
    return pytz.timezone(DEFAULT_TIMEZONE)

def get_current_time(tz: Optional[str] = None) -> datetime:
    """
    Get current time in the specified timezone
    
    Args:
        tz: Timezone string (e.g., 'America/Chicago'). Uses DEFAULT_TIMEZONE if not specified.
    
    Returns:
        Timezone-aware datetime object
    """
    timezone_obj = pytz.timezone(tz) if tz else get_app_timezone()
    return datetime.now(timezone.utc).astimezone(timezone_obj)

def get_shift_start(dt: Optional[datetime] = None, tz: Optional[str] = None) -> datetime:
    """
    Get the start of the current shift (6 AM)
    Gaming center operates on 6 AM - 6 AM shifts
    
    Args:
        dt: Reference datetime. Uses current time if not specified.
        tz: Timezone string. Uses DEFAULT_TIMEZONE if not specified.
    
    Returns:
        Timezone-aware datetime for 6 AM of the current shift
    """
    timezone_obj = pytz.timezone(tz) if tz else get_app_timezone()
    
    if dt is None:
        dt = get_current_time(tz)
    elif dt.tzinfo is None:
        # Make timezone-aware if naive
        dt = timezone_obj.localize(dt)
    else:
        # Convert to target timezone
        dt = dt.astimezone(timezone_obj)
    
    # If current time is before 6 AM, shift start is yesterday at 6 AM
    if dt.hour < 6:
        shift_start = dt.replace(hour=6, minute=0, second=0, microsecond=0) - timedelta(days=1)
    else:
        # Otherwise, shift start is today at 6 AM
        shift_start = dt.replace(hour=6, minute=0, second=0, microsecond=0)
    
    return shift_start

def get_shift_end(dt: Optional[datetime] = None, tz: Optional[str] = None) -> datetime:
    """
    Get the end of the current shift (6 AM next day)
    
    Args:
        dt: Reference datetime. Uses current time if not specified.
        tz: Timezone string. Uses DEFAULT_TIMEZONE if not specified.
    
    Returns:
        Timezone-aware datetime for 6 AM of the next shift
    """
    shift_start = get_shift_start(dt, tz)
    return shift_start + timedelta(days=1)

def convert_to_app_timezone(dt: datetime, from_tz: Optional[str] = None) -> datetime:
    """
    Convert a datetime to the application's timezone
    
    Args:
        dt: Datetime to convert
        from_tz: Source timezone. Assumes UTC if dt is naive and from_tz not specified.
    
    Returns:
        Datetime in application timezone
    """
    app_tz = get_app_timezone()
    
    if dt.tzinfo is None:
        # Naive datetime - assume it's in from_tz or UTC
        source_tz = pytz.timezone(from_tz) if from_tz else pytz.UTC
        dt = source_tz.localize(dt)
    
    return dt.astimezone(app_tz)

def get_timezone_name(tz: Optional[str] = None) -> str:
    """
    Get the timezone name/abbreviation (e.g., 'CST' or 'CDT')
    
    Args:
        tz: Timezone string. Uses DEFAULT_TIMEZONE if not specified.
    
    Returns:
        Timezone abbreviation
    """
    timezone_obj = pytz.timezone(tz) if tz else get_app_timezone()
    now = datetime.now(timezone.utc).astimezone(timezone_obj)
    return now.strftime('%Z')

def format_datetime_for_display(dt: datetime, tz: Optional[str] = None, format_str: str = '%Y-%m-%d %I:%M %p %Z') -> str:
    """
    Format datetime for display in the application timezone
    
    Args:
        dt: Datetime to format
        tz: Target timezone. Uses DEFAULT_TIMEZONE if not specified.
        format_str: strftime format string
    
    Returns:
        Formatted datetime string
    """
    app_dt = convert_to_app_timezone(dt, tz)
    return app_dt.strftime(format_str)
