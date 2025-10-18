'use client'

import { useEffect, useState } from 'react'
import { Monitor, Gamepad2, Activity, DollarSign, Users, Clock, Settings, LogOut, Plus } from 'lucide-react'
import StationGrid from './StationGrid'
import SessionsList from './SessionsList'
import StatsCards from './StatsCards'
import AddStationModal from './AddStationModal'
import StartSessionModal from './StartSessionModal'
import { useStore } from '@/store/useStore'
import { stationsAPI, sessionsAPI, dashboardAPI } from '@/lib/api'
import type { Station } from '@/types'

export default function Dashboard() {
  const { stations, sessions, stats, setStations, setSessions, setStats } = useStore()
  const [loading, setLoading] = useState(true)
  const [showAddStation, setShowAddStation] = useState(false)
  const [showStartSession, setShowStartSession] = useState(false)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  useEffect(() => {
    loadData()
    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
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
              <button className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-[#A0A0A0]" />
              </button>
              <button className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors">
                <LogOut className="w-5 h-5 text-[#A0A0A0]" />
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
              <StationGrid stations={stations} onStartSession={handleStartSession} />
            </div>

            {/* Active Sessions */}
            <div>
              <h2 className="text-lg font-semibold text-[#E5E5E5] mb-4">Active Sessions</h2>
              <SessionsList sessions={sessions.filter(s => s.status === 'ACTIVE')} />
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
