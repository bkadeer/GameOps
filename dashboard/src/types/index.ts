export type StationStatus = 'ONLINE' | 'OFFLINE' | 'IN_SESSION' | 'MAINTENANCE'
export type StationType = 'PC' | 'PS5' | 'XBOX' | 'SWITCH'
export type ControlMethod = 'AGENT' | 'WOL' | 'MANUAL'
export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'STOPPED'
export type PaymentMethod = 'CASH' | 'CARD' | 'ACCOUNT_BALANCE' | 'MOBILE_PAYMENT'

export interface Station {
  id: string
  name: string
  station_type: StationType
  location: string
  status: StationStatus
  ip_address?: string
  mac_address?: string
  control_method: ControlMethod
  control_address?: string
  specs?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_name?: string
  station_id: string
  station_name?: string
  station?: Station
  started_at: string
  scheduled_end_at: string
  actual_end_at?: string
  duration_minutes: number
  extended_minutes: number
  status: SessionStatus
  payment_id?: string
  notes?: string
}

export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER'
  account_balance: number
  is_active: boolean
  created_at: string
}

export interface Payment {
  id: string
  user_id?: string
  amount: number
  payment_method: PaymentMethod
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  created_at: string
}

export interface DashboardStats {
  total_stations: number
  active_sessions: number
  available_stations: number
  revenue_today: number
}

export interface RevenueData {
  today: number
  yesterday: number
  change_percent: number
  total_period: number
  avg_per_period: number
  revenue_per_session: number
  hourly: Array<{
    hour: number
    revenue: number
    sessions: number
  }>
  daily: Array<{
    date: string
    revenue: number
    sessions: number
  }>
  weekly: Array<{
    week: string
    revenue: number
    sessions: number
  }>
}

export interface SessionAnalytics {
  total_today: number
  active_now: number
  avg_duration: number
  hourly: Array<{ hour: number; count: number; revenue: number }>
  daily: Array<{ date: string; count: number; avg_duration: number }>
}

export interface StationUtilization {
  stations: Array<{
    id: string
    name: string
    utilization_percent: number
    total_sessions: number
    total_hours: number
    revenue: number
  }>
  overall_utilization: number
  total_stations: number
}

export interface PeakHoursData {
  heatmap: Array<{
    day: number // 0-6 (Sun-Sat)
    hour: number // 0-23
    value: number // session count
  }>
  peak_day: string
  peak_hour: number
  busiest_time: string
}
