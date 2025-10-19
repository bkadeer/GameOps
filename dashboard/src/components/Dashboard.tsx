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
    <div className="min-h-screen bg-[#1C1C1C]">
      {/* Top Navigation */}
      <nav className="bg-[#252525] border-b border-[#333333] sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ed6802] to-[#ff7a1a] rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#E5E5E5]">GameOps</h1>
                <p className="text-xs text-[#A0A0A0]">Station Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* WebSocket Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2D2D2D]">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-500 font-medium">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500 font-medium">Offline</span>
                  </>
                )}
              </div>

              {user && (
                <div className="text-right mr-2">
                  <p className="text-sm text-[#E5E5E5] font-medium">{user.username}</p>
                  <p className="text-xs text-[#A0A0A0]">{user.role}</p>
                </div>
              )}
              <button 
                className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-[#A0A0A0]" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors group"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-[#A0A0A0] group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ed6802]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Station Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#E5E5E5]">Gaming Stations</h2>
                <button
                  onClick={() => setShowAddStation(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ed6802] hover:bg-[#ff7a1a] text-white rounded-lg font-medium transition-colors"
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
            <div>
              <h2 className="text-lg font-semibold text-[#E5E5E5] mb-4">Active Sessions</h2>
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
