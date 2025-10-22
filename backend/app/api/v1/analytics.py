"""
Analytics API Endpoints
Provides business intelligence and analytics data
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Literal
from app.api.deps import get_db, get_current_user
from app.models import User
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/revenue")
async def get_revenue_analytics(
    period: Literal['day', 'week', 'month'] = Query('week', description="Time period for analytics"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get revenue analytics
    
    **Admin only endpoint**
    
    Returns comprehensive revenue metrics including:
    - Today vs yesterday comparison
    - Time-series data (daily/weekly/monthly)
    - Revenue per session
    - Peak revenue periods
    - Total and average revenue
    
    Args:
        period: Time period ('day', 'week', or 'month')
    
    Returns:
        Revenue analytics data
    """
    # Check if user is admin
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    analytics_service = AnalyticsService(db)
    data = await analytics_service.get_revenue_analytics(period)
    
    return data


@router.get("/sessions")
async def get_session_analytics(
    period: Literal['day', 'week', 'month'] = Query('week', description="Time period for analytics"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get session analytics
    
    **Admin only endpoint**
    
    Returns comprehensive session metrics including:
    - Active sessions count
    - Total sessions today
    - Average session duration
    - Hourly distribution (last 24 hours)
    - Daily distribution
    - Completion rate
    - Peak hours
    
    Args:
        period: Time period for daily data
    
    Returns:
        Session analytics data
    """
    # Check if user is admin
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    analytics_service = AnalyticsService(db)
    data = await analytics_service.get_session_analytics(period)
    
    return data


@router.get("/utilization")
async def get_station_utilization(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get station utilization analytics
    
    **Admin only endpoint**
    
    Returns station performance metrics including:
    - Overall utilization percentage
    - Per-station metrics (utilization, sessions, revenue)
    - Best and worst performers
    - Downtime tracking
    - Average session duration per station
    
    Returns:
        Station utilization data
    """
    # Check if user is admin
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    analytics_service = AnalyticsService(db)
    data = await analytics_service.get_station_utilization()
    
    return data


@router.get("/peak-hours")
async def get_peak_hours_heatmap(
    period: Literal['day', 'week', 'month'] = Query('day', description="Time period for peak hours"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get peak hours heatmap data
    
    **Admin only endpoint**
    
    Returns heatmap data showing:
    - Session count by day of week and hour
    - Peak and quietest times
    - Total minutes and unique users per time slot
    - Dynamic based on period (today/week/month)
    
    Args:
        period: Time period ('day', 'week', or 'month')
    
    Returns:
        Peak hours heatmap data
    """
    # Check if user is admin
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    analytics_service = AnalyticsService(db)
    data = await analytics_service.get_peak_hours_heatmap(period)
    
    return data


@router.get("/customer-insights")
async def get_customer_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get customer behavior insights
    
    **Admin only endpoint**
    
    Returns customer analytics including:
    - New vs returning customers
    - Customer lifetime value
    - Average spend per customer
    - Most frequent customers
    - Customer retention rate
    
    Returns:
        Customer insights data
    """
    # Check if user is admin
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Query customer metrics
    query = text("""
        SELECT 
            COUNT(DISTINCT user_name) as total_customers,
            COUNT(DISTINCT CASE 
                WHEN started_at >= NOW() - INTERVAL '7 days' 
                THEN user_name 
            END) as active_this_week,
            COUNT(DISTINCT CASE 
                WHEN started_at >= NOW() - INTERVAL '30 days' 
                THEN user_name 
            END) as active_this_month,
            AVG(session_count) as avg_sessions_per_customer,
            AVG(total_spent) as avg_lifetime_value
        FROM (
            SELECT 
                user_name,
                COUNT(*) as session_count,
                COALESCE(SUM(p.amount), 0) as total_spent
            FROM sessions s
            LEFT JOIN payments p ON s.payment_id = p.id AND p.status = 'COMPLETED'
            WHERE user_name IS NOT NULL
            GROUP BY user_name
        ) customer_stats
    """)
    
    result = await db.execute(query)
    row = result.fetchone()
    
    # Get top customers
    top_customers_query = text("""
        SELECT 
            user_name,
            COUNT(*) as session_count,
            COALESCE(SUM(p.amount), 0) as total_spent,
            MAX(s.started_at) as last_visit
        FROM sessions s
        LEFT JOIN payments p ON s.payment_id = p.id AND p.status = 'COMPLETED'
        WHERE user_name IS NOT NULL
        GROUP BY user_name
        ORDER BY total_spent DESC
        LIMIT 10
    """)
    
    result = await db.execute(top_customers_query)
    top_customers = result.fetchall()
    
    return {
        'total_customers': row.total_customers if row else 0,
        'active_this_week': row.active_this_week if row else 0,
        'active_this_month': row.active_this_month if row else 0,
        'avg_sessions_per_customer': round(float(row.avg_sessions_per_customer), 1) if row and row.avg_sessions_per_customer else 0,
        'avg_lifetime_value': round(float(row.avg_lifetime_value), 2) if row and row.avg_lifetime_value else 0,
        'top_customers': [
            {
                'name': c.user_name,
                'sessions': c.session_count,
                'total_spent': round(float(c.total_spent), 2),
                'last_visit': c.last_visit.isoformat() if c.last_visit else None,
            }
            for c in top_customers
        ]
    }


@router.get("/performance-trends")
async def get_performance_trends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get performance trends and forecasts
    
    **Admin only endpoint**
    
    Returns trend analysis including:
    - Revenue growth rate
    - Session count trends
    - Utilization trends
    - Week-over-week comparisons
    - Month-over-month comparisons
    
    Returns:
        Performance trend data
    """
    # Check if user is admin
    if current_user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # This week vs last week
    query = text("""
        SELECT 
            -- This week
            COUNT(CASE WHEN started_at >= DATE_TRUNC('week', NOW()) THEN 1 END) as sessions_this_week,
            COALESCE(SUM(CASE WHEN started_at >= DATE_TRUNC('week', NOW()) THEN p.amount END), 0) as revenue_this_week,
            
            -- Last week
            COUNT(CASE 
                WHEN started_at >= DATE_TRUNC('week', NOW()) - INTERVAL '7 days'
                AND started_at < DATE_TRUNC('week', NOW())
                THEN 1 
            END) as sessions_last_week,
            COALESCE(SUM(CASE 
                WHEN started_at >= DATE_TRUNC('week', NOW()) - INTERVAL '7 days'
                AND started_at < DATE_TRUNC('week', NOW())
                THEN p.amount 
            END), 0) as revenue_last_week,
            
            -- This month
            COUNT(CASE WHEN started_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as sessions_this_month,
            COALESCE(SUM(CASE WHEN started_at >= DATE_TRUNC('month', NOW()) THEN p.amount END), 0) as revenue_this_month,
            
            -- Last month
            COUNT(CASE 
                WHEN started_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                AND started_at < DATE_TRUNC('month', NOW())
                THEN 1 
            END) as sessions_last_month,
            COALESCE(SUM(CASE 
                WHEN started_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                AND started_at < DATE_TRUNC('month', NOW())
                THEN p.amount 
            END), 0) as revenue_last_month
        FROM sessions s
        LEFT JOIN payments p ON s.payment_id = p.id AND p.status = 'COMPLETED'
    """)
    
    result = await db.execute(query)
    row = result.fetchone()
    
    # Calculate growth rates
    session_wow_growth = 0
    revenue_wow_growth = 0
    session_mom_growth = 0
    revenue_mom_growth = 0
    
    if row:
        if row.sessions_last_week > 0:
            session_wow_growth = ((row.sessions_this_week - row.sessions_last_week) / row.sessions_last_week) * 100
        if row.revenue_last_week > 0:
            revenue_wow_growth = ((float(row.revenue_this_week) - float(row.revenue_last_week)) / float(row.revenue_last_week)) * 100
        if row.sessions_last_month > 0:
            session_mom_growth = ((row.sessions_this_month - row.sessions_last_month) / row.sessions_last_month) * 100
        if row.revenue_last_month > 0:
            revenue_mom_growth = ((float(row.revenue_this_month) - float(row.revenue_last_month)) / float(row.revenue_last_month)) * 100
    
    return {
        'week_over_week': {
            'sessions': {
                'current': row.sessions_this_week if row else 0,
                'previous': row.sessions_last_week if row else 0,
                'growth_percent': round(session_wow_growth, 2),
            },
            'revenue': {
                'current': round(float(row.revenue_this_week), 2) if row else 0,
                'previous': round(float(row.revenue_last_week), 2) if row else 0,
                'growth_percent': round(revenue_wow_growth, 2),
            }
        },
        'month_over_month': {
            'sessions': {
                'current': row.sessions_this_month if row else 0,
                'previous': row.sessions_last_month if row else 0,
                'growth_percent': round(session_mom_growth, 2),
            },
            'revenue': {
                'current': round(float(row.revenue_this_month), 2) if row else 0,
                'previous': round(float(row.revenue_last_month), 2) if row else 0,
                'growth_percent': round(revenue_mom_growth, 2),
            }
        }
    }
