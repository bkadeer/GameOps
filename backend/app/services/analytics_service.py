"""
Analytics Service
Provides comprehensive analytics and business intelligence metrics
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from sqlalchemy import func, and_, or_, extract, case, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.session import Session, SessionStatus
from app.models.station import Station
from app.models.payment import Payment, PaymentStatus
from app.models.event import Event
from app.core.redis import redis_manager
from app.core.timezone import get_current_time, get_shift_start, get_shift_end


class AnalyticsService:
    """Service for generating analytics and business metrics"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_revenue_analytics(self, period: str = 'day') -> Dict[str, Any]:
        """
        Get comprehensive revenue analytics
        
        Args:
            period: 'day', 'week', or 'month' (default: 'day' for yesterday)
        
        Returns:
            Revenue data with trends, comparisons, and forecasts
        """
        now = get_current_time()  # Current time in CST
        now_utc = datetime.now(timezone.utc)
        
        # Current shift start
        current_shift_start = get_shift_start(now)
        
        # Yesterday's shift (completed: 6 AM - 6 AM)
        yesterday_shift_start = current_shift_start - timedelta(days=1)
        yesterday_shift_end = current_shift_start
        
        # Day before yesterday's shift
        day_before_shift_start = yesterday_shift_start - timedelta(days=1)
        day_before_shift_end = yesterday_shift_start
        
        # Yesterday's revenue (completed shift: 6 AM - 6 AM)
        yesterday_revenue = await self._get_revenue_sum(yesterday_shift_start, yesterday_shift_end)
        
        # Day before yesterday's revenue (for comparison)
        day_before_revenue = await self._get_revenue_sum(day_before_shift_start, day_before_shift_end)
        
        # Calculate change percentage
        change_percent = 0
        if day_before_revenue > 0:
            change_percent = ((yesterday_revenue - day_before_revenue) / day_before_revenue) * 100
        
        # Get time-series data based on period
        if period == 'day':
            # For "Yesterday" view, show hourly data for yesterday's completed shift
            time_series = await self._get_hourly_revenue(yesterday_shift_start, yesterday_shift_end)
        elif period == 'week':
            # For "Week" view, show daily data for last 7 completed days
            week_start = yesterday_shift_start - timedelta(days=6)  # 7 days total including yesterday
            time_series = await self._get_daily_revenue(week_start, yesterday_shift_end)
        else:
            # For "Month" view, show weekly data for last 12 weeks
            month_start = yesterday_shift_start - timedelta(weeks=12)
            time_series = await self._get_weekly_revenue(month_start, yesterday_shift_end)
        
        # Calculate additional metrics
        total_revenue = sum(item['revenue'] for item in time_series)
        avg_revenue = total_revenue / len(time_series) if time_series else 0
        
        # Revenue per session
        total_sessions = sum(item['sessions'] for item in time_series)
        revenue_per_session = total_revenue / total_sessions if total_sessions > 0 else 0
        
        # Peak revenue day/week/month
        peak_period = max(time_series, key=lambda x: x['revenue']) if time_series else None
        
        return {
            'today': round(yesterday_revenue, 2),  # "Today" now shows yesterday's completed shift
            'yesterday': round(day_before_revenue, 2),  # Comparison with day before
            'change_percent': round(change_percent, 2),
            'total_period': round(total_revenue, 2),
            'avg_per_period': round(avg_revenue, 2),
            'revenue_per_session': round(revenue_per_session, 2),
            'peak_period': peak_period,
            'hourly': time_series if period == 'day' else [],
            'daily': time_series if period == 'week' else [],
            'weekly': time_series if period == 'month' else [],
        }
    
    async def get_session_analytics(self, period: str = 'day') -> Dict[str, Any]:
        """
        Get comprehensive session analytics
        
        Args:
            period: 'day', 'week', or 'month' (default: 'day' for yesterday)
        
        Returns:
            Session metrics including duration, frequency, and patterns
        """
        now = get_current_time()  # Current time in CST
        now_utc = datetime.now(timezone.utc)
        
        # Current shift start
        current_shift_start = get_shift_start(now)
        
        # Yesterday's shift (completed: 6 AM - 6 AM)
        yesterday_shift_start = current_shift_start - timedelta(days=1)
        yesterday_shift_end = current_shift_start
        
        # Active sessions right now (still useful for live monitoring)
        active_now = await self._count_active_sessions()
        
        # Total sessions yesterday (completed shift)
        total_today = await self._count_sessions(yesterday_shift_start, yesterday_shift_end)
        
        # Average session duration for yesterday (completed sessions only)
        avg_duration = await self._get_avg_session_duration(yesterday_shift_start, yesterday_shift_end)
        
        # Get data based on period
        if period == 'day':
            # For "Yesterday" view, show hourly data for yesterday's completed shift
            hourly_data = await self._get_hourly_sessions(yesterday_shift_start, yesterday_shift_end)
            daily_data = []
        elif period == 'week':
            # For "Week" view, show daily data for last 7 completed days
            week_start = yesterday_shift_start - timedelta(days=6)
            hourly_data = []
            daily_data = await self._get_daily_sessions(week_start, yesterday_shift_end)
        else:
            # For "Month" view, show daily data for last 30 days
            month_start = yesterday_shift_start - timedelta(days=29)
            hourly_data = []
            daily_data = await self._get_daily_sessions(month_start, yesterday_shift_end)
        
        # Session completion rate for yesterday
        completion_rate = await self._get_completion_rate(yesterday_shift_start, yesterday_shift_end)
        
        # Average sessions per day (only for week/month views)
        if daily_data:
            total_sessions = sum(d['count'] for d in daily_data)
            days_count = len(daily_data)
            avg_sessions_per_day = total_sessions / days_count if days_count > 0 else 0
        else:
            avg_sessions_per_day = total_today
        
        # Peak hour (only for today view)
        peak_hour = max(hourly_data, key=lambda x: x['count']) if hourly_data else None
        
        return {
            'active_now': active_now,
            'total_today': total_today,
            'avg_duration': round(avg_duration, 1),
            'completion_rate': round(completion_rate, 1),
            'avg_sessions_per_day': round(avg_sessions_per_day, 1),
            'peak_hour': peak_hour,
            'hourly': hourly_data,
            'daily': daily_data,
        }
    
    async def get_station_utilization(self) -> Dict[str, Any]:
        """
        Get station utilization metrics
        
        Returns:
            Utilization data for each station with performance metrics
        """
        # Get all stations
        result = await self.db.execute(
            select(Station).order_by(Station.name)
        )
        stations = result.scalars().all()
        
        station_metrics = []
        total_utilization = 0
        
        for station in stations:
            metrics = await self._get_station_metrics(station.id)
            station_metrics.append({
                'id': station.id,
                'name': station.name,
                'utilization_percent': metrics['utilization'],
                'total_sessions': metrics['total_sessions'],
                'total_hours': metrics['total_hours'],
                'revenue': metrics['revenue'],
                'avg_session_duration': metrics['avg_duration'],
                'downtime_hours': metrics['downtime_hours'],
            })
            total_utilization += metrics['utilization']
        
        overall_utilization = total_utilization / len(stations) if stations else 0
        
        # Find best and worst performers
        best_performer = max(station_metrics, key=lambda x: x['revenue']) if station_metrics else None
        worst_performer = min(station_metrics, key=lambda x: x['revenue']) if station_metrics else None
        
        return {
            'overall_utilization': round(overall_utilization, 2),
            'stations': station_metrics,
            'best_performer': best_performer,
            'worst_performer': worst_performer,
            'total_stations': len(stations),
        }
    
    async def get_peak_hours_heatmap(self, period: str = 'day') -> Dict[str, Any]:
        """
        Get peak hours heatmap data based on period
        
        Args:
            period: 'day', 'week', or 'month' (default: 'day' for yesterday)
        
        Returns:
            Heatmap data showing busiest times based on selected period
        """
        now = get_current_time()  # Current time in CST
        current_shift_start = get_shift_start(now)
        
        # Yesterday's shift (completed: 6 AM - 6 AM)
        yesterday_shift_start = current_shift_start - timedelta(days=1)
        yesterday_shift_end = current_shift_start
        
        # Determine date range based on period
        if period == 'day':
            # For yesterday: show hourly data for yesterday's completed shift
            start_date = yesterday_shift_start
            end_date = yesterday_shift_end
        elif period == 'week':
            # For week: show last 7 completed days
            start_date = yesterday_shift_start - timedelta(days=6)
            end_date = yesterday_shift_end
        else:
            # For month: show last 30 days
            start_date = yesterday_shift_start - timedelta(days=29)
            end_date = yesterday_shift_end
        
        # Query sessions grouped by day of week and hour (in CST timezone)
        query = text("""
            SELECT 
                EXTRACT(DOW FROM started_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') as day,
                EXTRACT(HOUR FROM started_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') as hour,
                COUNT(*) as session_count,
                SUM(duration_minutes + extended_minutes) as total_minutes,
                COUNT(DISTINCT user_name) as unique_users
            FROM sessions
            WHERE started_at >= :start_date
                AND started_at < :end_date
                AND status IN ('STOPPED', 'ACTIVE', 'EXPIRED')
            GROUP BY day, hour
            ORDER BY day, hour
        """)
        
        result = await self.db.execute(query, {'start_date': start_date, 'end_date': end_date})
        rows = result.fetchall()
        
        # Build heatmap data
        heatmap = []
        max_value = 0
        peak_day = 0
        peak_hour = 0
        peak_value = 0
        
        for row in rows:
            day = int(row.day)
            hour = int(row.hour)
            value = row.session_count
            
            heatmap.append({
                'day': day,
                'hour': hour,
                'value': value,
                'total_minutes': row.total_minutes,
                'unique_users': row.unique_users,
            })
            
            if value > peak_value:
                peak_value = value
                peak_day = day
                peak_hour = hour
            
            max_value = max(max_value, value)
        
        # Day names
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        # Calculate busiest time slot
        busiest_time = f"{day_names[peak_day]} {peak_hour:02d}:00"
        
        # Find quietest time
        all_slots = {(d, h): 0 for d in range(7) for h in range(24)}
        for item in heatmap:
            all_slots[(item['day'], item['hour'])] = item['value']
        
        quietest = min(all_slots.items(), key=lambda x: x[1])
        quietest_time = f"{day_names[quietest[0][0]]} {quietest[0][1]:02d}:00"
        
        return {
            'heatmap': heatmap,
            'peak_day': day_names[peak_day],
            'peak_hour': peak_hour,
            'busiest_time': busiest_time,
            'quietest_time': quietest_time,
            'max_sessions': max_value,
        }
    
    # Helper methods
    
    async def _get_revenue_sum(self, start: datetime, end: datetime) -> float:
        """Get total revenue between dates"""
        query = text("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM payments
            WHERE created_at >= :start 
                AND created_at < :end
                AND status = 'COMPLETED'
        """)
        result = await self.db.execute(query, {'start': start, 'end': end})
        row = result.fetchone()
        return float(row.total) if row else 0.0
    
    async def _get_hourly_revenue(self, start: datetime, end: datetime) -> List[Dict]:
        """Get hourly revenue breakdown for today in CST timezone"""
        query = text("""
            SELECT 
                EXTRACT(HOUR FROM p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') as hour,
                COALESCE(SUM(p.amount), 0) as revenue,
                COUNT(DISTINCT s.id) as sessions
            FROM payments p
            LEFT JOIN sessions s ON s.payment_id = p.id
            WHERE p.created_at >= :start 
                AND p.created_at < :end
                AND p.status = 'COMPLETED'
            GROUP BY EXTRACT(HOUR FROM p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')
            ORDER BY hour
        """)
        result = await self.db.execute(query, {'start': start, 'end': end})
        rows = result.fetchall()
        
        return [
            {
                'hour': int(row.hour),
                'revenue': round(float(row.revenue), 2),
                'sessions': row.sessions,
            }
            for row in rows
        ]
    
    async def _get_daily_revenue(self, start: datetime, end: datetime) -> List[Dict]:
        """Get daily revenue breakdown"""
        query = text("""
            SELECT 
                DATE(p.created_at) as date,
                COALESCE(SUM(p.amount), 0) as revenue,
                COUNT(DISTINCT s.id) as sessions
            FROM payments p
            LEFT JOIN sessions s ON s.payment_id = p.id
            WHERE p.created_at >= :start 
                AND p.created_at < :end
                AND p.status = 'COMPLETED'
            GROUP BY DATE(p.created_at)
            ORDER BY date
        """)
        result = await self.db.execute(query, {'start': start, 'end': end})
        rows = result.fetchall()
        
        return [
            {
                'date': row.date.strftime('%Y-%m-%d'),
                'revenue': round(float(row.revenue), 2),
                'sessions': row.sessions,
            }
            for row in rows
        ]
    
    async def _get_weekly_revenue(self, start: datetime, end: datetime) -> List[Dict]:
        """Get weekly revenue breakdown"""
        query = text("""
            SELECT 
                DATE_TRUNC('week', p.created_at) as week,
                COALESCE(SUM(p.amount), 0) as revenue,
                COUNT(DISTINCT s.id) as sessions
            FROM payments p
            LEFT JOIN sessions s ON s.payment_id = p.id
            WHERE p.created_at >= :start 
                AND p.created_at < :end
                AND p.status = 'COMPLETED'
            GROUP BY week
            ORDER BY week
        """)
        result = await self.db.execute(query, {'start': start, 'end': end})
        rows = result.fetchall()
        
        return [
            {
                'week': row.week.strftime('%Y-W%U'),
                'revenue': round(float(row.revenue), 2),
                'sessions': row.sessions,
            }
            for row in rows
        ]
    
    async def _get_monthly_revenue(self, start: datetime, end: datetime) -> List[Dict]:
        """Get monthly revenue breakdown"""
        query = text("""
            SELECT 
                DATE_TRUNC('month', p.created_at) as month,
                COALESCE(SUM(p.amount), 0) as revenue,
                COUNT(DISTINCT s.id) as sessions
            FROM payments p
            LEFT JOIN sessions s ON s.payment_id = p.id
            WHERE p.created_at >= :start 
                AND p.created_at < :end
                AND p.status = 'COMPLETED'
            GROUP BY month
            ORDER BY month
        """)
        result = await self.db.execute(query, {'start': start, 'end': end})
        rows = result.fetchall()
        
        return [
            {
                'month': row.month.strftime('%Y-%m'),
                'revenue': round(float(row.revenue), 2),
                'sessions': row.sessions,
            }
            for row in rows
        ]
    
    async def _count_active_sessions(self) -> int:
        """Count currently active sessions"""
        query = text("SELECT COUNT(*) FROM sessions WHERE status = 'ACTIVE'")
        result = await self.db.execute(query)
        row = result.fetchone()
        return row[0] if row else 0
    
    async def _count_sessions(self, start: datetime, end: datetime) -> int:
        """Count sessions in date range"""
        query = text("""
            SELECT COUNT(*) 
            FROM sessions 
            WHERE started_at >= :start AND started_at < :end
        """)
        result = await self.db.execute(query, {'start': start, 'end': end})
        row = result.fetchone()
        return row[0] if row else 0
    
    async def _get_avg_session_duration(self, start: datetime, end: datetime) -> float:
        """Get average session duration in minutes"""
        query = text("""
            SELECT AVG(duration_minutes + COALESCE(extended_minutes, 0)) as avg_duration
            FROM sessions
            WHERE started_at >= :start 
                AND started_at < :end
                AND status IN ('STOPPED', 'EXPIRED')
                AND duration_minutes IS NOT NULL
                AND duration_minutes > 0
        """)
        result = await self.db.execute(query, {'start': start, 'end': end})
        row = result.fetchone()
        # Return 0 if no sessions or avg is NULL
        if not row or row.avg_duration is None:
            return 0.0
        return round(float(row.avg_duration), 1)
    
    async def _get_hourly_sessions(self, start: datetime, end: datetime) -> List[Dict]:
        """Get hourly session distribution in CST timezone"""
        query = text("""
            SELECT 
                EXTRACT(HOUR FROM started_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago') as hour,
                COUNT(*) as count,
                COALESCE(SUM(p.amount), 0) as revenue
            FROM sessions s
            LEFT JOIN payments p ON s.payment_id = p.id AND p.status = 'COMPLETED'
            WHERE s.started_at >= :start AND s.started_at < :end
            GROUP BY hour
            ORDER BY hour
        """)
        result = await self.db.execute(query, {'start': start, 'end': end})
        rows = result.fetchall()
        
        return [
            {
                'hour': int(row.hour),
                'count': row.count,
                'revenue': round(float(row.revenue), 2),
            }
            for row in rows
        ]
    
    async def _get_daily_sessions(self, start: datetime, end: datetime) -> List[Dict]:
        """Get daily session distribution"""
        query = text("""
            SELECT 
                DATE(started_at) as date,
                COUNT(*) as count,
                AVG(duration_minutes + extended_minutes) as avg_duration
            FROM sessions
            WHERE started_at >= :start AND started_at < :end
            GROUP BY date
            ORDER BY date
        """)
        result = await self.db.execute(query, {'start': start, 'end': end})
        rows = result.fetchall()
        
        return [
            {
                'date': row.date.strftime('%Y-%m-%d'),
                'count': row.count,
                'avg_duration': round(float(row.avg_duration), 1) if row.avg_duration else 0,
            }
            for row in rows
        ]
    
    async def _get_completion_rate(self, start: datetime, end: datetime) -> float:
        """Get session completion rate percentage"""
        query = text("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'STOPPED' THEN 1 ELSE 0 END) as completed
            FROM sessions
            WHERE started_at >= :start AND started_at < :end
        """)
        result = await self.db.execute(query, {'start': start, 'end': end})
        row = result.fetchone()
        
        if row and row.total > 0:
            return (row.completed / row.total) * 100
        return 0.0
    
    async def _get_station_metrics(self, station_id: str) -> Dict[str, Any]:
        """Get metrics for a specific station"""
        # Last 30 days
        start_date = datetime.utcnow() - timedelta(days=30)
        
        query = text("""
            SELECT 
                COUNT(*) as total_sessions,
                SUM(duration_minutes + extended_minutes) as total_minutes,
                AVG(duration_minutes + extended_minutes) as avg_duration,
                COALESCE(SUM(p.amount), 0) as revenue
            FROM sessions s
            LEFT JOIN payments p ON s.payment_id = p.id AND p.status = 'COMPLETED'
            WHERE s.station_id = :station_id
                AND s.started_at >= :start_date
        """)
        result = await self.db.execute(query, {'station_id': station_id, 'start_date': start_date})
        row = result.fetchone()
        
        total_hours = float(row.total_minutes) / 60 if row.total_minutes else 0
        
        # Calculate utilization (assuming 16 hours/day operation)
        available_hours = 30 * 16  # 30 days * 16 hours
        utilization = (total_hours / available_hours) * 100 if available_hours > 0 else 0
        
        # Downtime hours
        downtime_hours = available_hours - total_hours
        
        return {
            'total_sessions': row.total_sessions if row else 0,
            'total_hours': round(total_hours, 1),
            'avg_duration': round(float(row.avg_duration), 1) if row and row.avg_duration else 0,
            'revenue': round(float(row.revenue), 2) if row else 0,
            'utilization': round(utilization, 2),
            'downtime_hours': round(downtime_hours, 1),
        }
