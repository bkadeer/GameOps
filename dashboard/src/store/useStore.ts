import { create } from 'zustand'
import type { Station, Session, User, DashboardStats } from '@/types'

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  
  // Stations
  stations: Station[]
  setStations: (stations: Station[]) => void
  updateStation: (id: string, data: Partial<Station>) => void
  
  // Sessions
  sessions: Session[]
  setSessions: (sessions: Session[]) => void
  addSession: (session: Session) => void
  updateSession: (id: string, data: Partial<Session>) => void
  
  // Dashboard Stats
  stats: DashboardStats | null
  setStats: (stats: DashboardStats) => void
  
  // UI State
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  // Stations
  stations: [],
  setStations: (stations) => set({ stations }),
  updateStation: (id, data) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    })),
  
  // Sessions
  sessions: [],
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (id, data) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    })),
  
  // Dashboard Stats
  stats: null,
  setStats: (stats) => set({ stats }),
  
  // UI State
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
