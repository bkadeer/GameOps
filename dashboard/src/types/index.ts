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
  station_id: string
  station?: Station
  user_id?: string
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
