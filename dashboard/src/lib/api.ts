import axios from 'axios'
import type { Station, Session, User, DashboardStats } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data)
      
      // Handle 401 Unauthorized - redirect to login
      if (error.response.status === 401) {
        console.warn('Authentication expired. Redirecting to login...')
        localStorage.removeItem('access_token')
        if (typeof window !== 'undefined') {
          // Store a flag to show message on login page
          sessionStorage.setItem('auth_expired', 'true')
          window.location.href = '/login'
        }
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response from server. Is the backend running?')
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password })
    return response.data
  },
  logout: () => {
    localStorage.removeItem('access_token')
  },
}

export const stationsAPI = {
  getAll: async (): Promise<Station[]> => {
    const response = await api.get('/stations')
    return response.data
  },
  getById: async (id: string): Promise<Station> => {
    const response = await api.get(`/stations/${id}`)
    return response.data
  },
  create: async (data: Partial<Station>): Promise<Station> => {
    const response = await api.post('/stations', data)
    return response.data
  },
  update: async (id: string, data: Partial<Station>): Promise<Station> => {
    const response = await api.put(`/stations/${id}`, data)
    return response.data
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/stations/${id}`)
  },
}

export const sessionsAPI = {
  getAll: async (): Promise<Session[]> => {
    const response = await api.get('/sessions')
    return response.data
  },
  getById: async (id: string): Promise<Session> => {
    const response = await api.get(`/sessions/${id}`)
    return response.data
  },
  create: async (data: {
    station_id: string
    duration_minutes: number
    payment_method: string
    amount: number
    notes?: string
  }): Promise<Session> => {
    const response = await api.post('/sessions', data)
    return response.data
  },
  extend: async (id: string, additional_minutes: number, payment_method: string, amount: number): Promise<Session> => {
    const response = await api.put(`/sessions/${id}/extend`, {
      additional_minutes,
      payment_method,
      amount,
    })
    return response.data
  },
  end: async (id: string): Promise<Session> => {
    const response = await api.delete(`/sessions/${id}`)
    return response.data
  },
}

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard')
    return response.data
  },
}

export default api
