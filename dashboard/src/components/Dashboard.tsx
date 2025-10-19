'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Gamepad2, Activity, DollarSign, Users, Clock, Settings, LogOut, Plus, Wifi, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'
import StationGrid from './StationGrid'
import SessionsList from './SessionsList'
import StatsCards from './StatsCards'
import AddStationModal from './AddStationModal'
import StartSessionModal from './StartSessionModal'
import AmbientClock from './AmbientClock'
import { useStore } from '@/store/useStore'
import { stationsAPI, sessionsAPI, dashboardAPI, authAPI } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { Station } from '@/types'

export default function Dashboard() {
  const router = useRouter()
  const { stations, sessions, stats, setStations, setSessions, setStats, user, clearUser } = useStore()
  const [loading, setLoading] = useState(true)
  const [showAddStation, setShowAddStation] = useState(false)
  const [showStartSession, setShowStartSession] = useState(false)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  // WebSocket connection for real-time updates
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/dashboard'
  
  // Memoize WebSocket callbacks to prevent reconnections
  const handleStationUpdate = useCallback((data: any) => {
    console.log('Station update received:', data)
    stationsAPI.getAll().then(setStations).catch(console.error)
  }, [setStations])

  const handleSessionUpdate = useCallback((data: any) => {
    console.log('Session update received:', data)
    // Immediately refresh data for real-time updates
    Promise.all([
      sessionsAPI.getAll(),
      dashboardAPI.getStats(),
      stationsAPI.getAll()
    ]).then(([sessionsData, statsData, stationsData]) => {
      setSessions(sessionsData)
      setStats(statsData)
      setStations(stationsData)
    }).catch(console.error)
  }, [setSessions, setStats, setStations])

  const handleStatsUpdate = useCallback((data: any) => {
    console.log('Stats update received:', data)
    setStats(data)
  }, [setStats])

  const handleConnect = useCallback(() => {
    console.log('✅ Dashboard connected to real-time updates')
    // Only show toast once, not on every reconnect
    toast.success('Connected to real-time updates', { 
      duration: 1500,
      id: 'ws-connected' // Prevent duplicate toasts
    })
  }, [])

  const handleDisconnect = useCallback(() => {
    console.log('🔌 Dashboard disconnected from real-time updates')
  }, [])

  const { isConnected } = useWebSocket(WS_URL, {
    onStationUpdate: handleStationUpdate,
    onSessionUpdate: handleSessionUpdate,
    onStatsUpdate: handleStatsUpdate,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
  })

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [stationsData, sessionsData, statsData] = await Promise.all([
        stationsAPI.getAll().catch(() => []),
        sessionsAPI.getAll().catch(() => []),
        dashboardAPI.getStats().catch(() => ({
          total_stations: 0,
          active_sessions: 0,
          available_stations: 0,
          revenue_today: 0
        })),
      ])
      setStations(stationsData)
      setSessions(sessionsData)
      setStats(statsData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      setLoading(false)
    }
  }

  const handleStartSession = (station: Station) => {
    setSelectedStation(station)
    setShowStartSession(true)
  }

  const handleLogout = () => {
    authAPI.logout()
    clearUser()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Top Navigation - Enhanced with glassmorphism */}
      <nav className="bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800/50 sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="max-w-[1920px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ed6802] via-[#ff7a1a] to-[#ff8c3a] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ed6802]/30 ring-2 ring-[#ed6802]/20">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100 tracking-tight">GameOps</h1>
                <p className="text-xs text-gray-400 font-medium">Station Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              {/* Ambient Clock */}
              <AmbientClock />
              
              {/* WebSocket Status Indicator - Enhanced */}
              <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300 ${
                isConnected 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
                  : 'bg-neutral-800/60 border border-neutral-700/50'
              }`}>
                {isConnected ? (
                  <>
                    <div className="relative">
                      <Wifi className="w-4 h-4 text-emerald-400" />
                      <div className="absolute inset-0 animate-ping">
                        <Wifi className="w-4 h-4 text-emerald-400 opacity-40" />
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold tracking-wide">LIVE</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500 font-semibold tracking-wide">OFFLINE</span>
                  </>
                )}
              </div>

              {user && (
                <div className="text-right px-4 py-2 bg-neutral-800/40 rounded-xl border border-neutral-700/50">
                  <p className="text-sm text-gray-200 font-semibold tracking-tight">{user.username}</p>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{user.role}</p>
                </div>
              )}
              <button 
                className="p-2.5 hover:bg-neutral-800/60 rounded-xl transition-all duration-300 hover:scale-105 border border-transparent hover:border-neutral-700/50"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-400 hover:text-gray-300 transition-colors" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2.5 hover:bg-red-500/10 rounded-xl transition-all duration-300 hover:scale-105 border border-transparent hover:border-red-500/30 group"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[95%] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ed6802]"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ed6802] opacity-20"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {/* Stats Cards */}
            <div className="animate-fade-in">
              <StatsCards stats={stats} />
            </div>

            {/* Station Grid */}
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Gaming Stations</h2>
                  <p className="text-sm text-gray-400 mt-1">Manage and monitor all stations</p>
                </div>
                <button
                  onClick={() => setShowAddStation(true)}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-[#ed6802] to-[#ff7a1a] hover:from-[#ff7a1a] hover:to-[#ff8c3a] text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#ed6802]/30 border border-[#ff7a1a]/20"
                >
                  <Plus className="w-4 h-4" />
                  Add Station
                </button>
              </div>
              <StationGrid 
                stations={stations} 
                onStartSession={handleStartSession}
                onUpdate={loadData}
              />
            </div>

            {/* Active Sessions */}
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Active Sessions</h2>
                <p className="text-sm text-gray-400 mt-1">Currently running gaming sessions</p>
              </div>
              <SessionsList 
                sessions={sessions.filter(s => s.status === 'ACTIVE')} 
                onUpdate={loadData}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AddStationModal
        isOpen={showAddStation}
        onClose={() => setShowAddStation(false)}
        onSuccess={loadData}
      />
      <StartSessionModal
        isOpen={showStartSession}
        onClose={() => setShowStartSession(false)}
        onSuccess={loadData}
        station={selectedStation}
      />
    </div>
  )
}
