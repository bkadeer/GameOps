'use client'

import { useEffect, useState } from 'react'
import { Monitor, Gamepad2, Activity, DollarSign, Users, Clock, Settings, LogOut } from 'lucide-react'
import StationGrid from './StationGrid'
import SessionsList from './SessionsList'
import StatsCards from './StatsCards'
import { useStore } from '@/store/useStore'
import { stationsAPI, sessionsAPI, dashboardAPI } from '@/lib/api'

export default function Dashboard() {
  const { stations, sessions, stats, setStations, setSessions, setStats } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [stationsData, sessionsData, statsData] = await Promise.all([
        stationsAPI.getAll(),
        sessionsAPI.getAll(),
        dashboardAPI.getStats(),
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
              <h2 className="text-lg font-semibold text-[#E5E5E5] mb-4">Gaming Stations</h2>
              <StationGrid stations={stations} />
            </div>

            {/* Active Sessions */}
            <div>
              <h2 className="text-lg font-semibold text-[#E5E5E5] mb-4">Active Sessions</h2>
              <SessionsList sessions={sessions.filter(s => s.status === 'ACTIVE')} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
