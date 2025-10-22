'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, Activity, DollarSign, Clock, BarChart3, Globe } from 'lucide-react'
import { analyticsAPI } from '@/lib/api'
import RevenueChart from './RevenueChart'
import SessionChart from './SessionChart'
import StationUtilizationChart from './StationUtilizationChart'
import PeakHoursHeatmap from './PeakHoursHeatmap'
import type { RevenueData, SessionAnalytics, StationUtilization, PeakHoursData } from '@/types'
import toast from 'react-hot-toast'
import { getTimezoneAbbreviation, getDisplayTimezone } from '@/lib/timezone'

export default function Analytics() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [sessionData, setSessionData] = useState<SessionAnalytics | null>(null)
  const [utilizationData, setUtilizationData] = useState<StationUtilization | null>(null)
  const [peakHoursData, setPeakHoursData] = useState<PeakHoursData | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [revenue, sessions, utilization, peakHours] = await Promise.all([
        analyticsAPI.getRevenue(period),
        analyticsAPI.getSessions(period),
        analyticsAPI.getStationUtilization(),
        analyticsAPI.getPeakHours(period),
      ])

      setRevenueData(revenue)
      setSessionData(sessions)
      setUtilizationData(utilization)
      setPeakHoursData(peakHours)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1a1a1a] via-[#1e1e1e] to-[#1a1a1a] border-b border-neutral-800/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-neutral-800/50 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
                  <BarChart3 className="w-7 h-7 text-[#ed6802]" />
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  Business insights and performance metrics
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800/50 border border-neutral-700/50">
                    <Globe className="w-3 h-3" />
                    {getTimezoneAbbreviation()}
                  </span>
                </p>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-neutral-900/50 rounded-xl p-1 border border-neutral-800/50">
              {(['day', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                    ${period === p
                      ? 'bg-gradient-to-r from-[#ed6802] to-[#ff7a1a] text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-neutral-800/50'
                    }
                  `}
                >
                  {p === 'day' ? 'Yesterday' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ed6802]"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ed6802] opacity-20"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                icon={DollarSign}
                label="Yesterday's Revenue"
                value={`$${revenueData?.today.toFixed(2) || '0.00'}`}
                change={revenueData?.change_percent || 0}
                color="emerald"
              />
              <MetricCard
                icon={Clock}
                label="Avg Session Duration"
                value={`${sessionData?.avg_duration || 0} min`}
                subtitle={`${sessionData?.total_today || 0} sessions yesterday`}
                color="violet"
              />
              <MetricCard
                icon={TrendingUp}
                label="Station Utilization"
                value={`${utilizationData?.overall_utilization.toFixed(1) || 0}%`}
                subtitle={`${utilizationData?.total_stations || 0} stations`}
                color="amber"
              />
            </div>

            {/* Revenue Chart */}
            <RevenueChart data={revenueData} period={period} />

            {/* Session Analytics */}
            <SessionChart data={sessionData} period={period} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Station Utilization */}
              <StationUtilizationChart data={utilizationData} />

              {/* Peak Hours Heatmap */}
              <PeakHoursHeatmap data={peakHoursData} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

interface MetricCardProps {
  icon: any
  label: string
  value: string | number
  change?: number
  subtitle?: string
  color: 'emerald' | 'cyan' | 'violet' | 'amber'
}

function MetricCard({ icon: Icon, label, value, change, subtitle, color }: MetricCardProps) {
  const colors = {
    emerald: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
    violet: 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30',
    amber: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  }

  return (
    <div className="relative group">
      <div className={`
        bg-gradient-to-br from-[#1a1a1a] via-[#1e1e1e] to-[#1a1a1a]
        rounded-2xl p-6 border border-neutral-700/30
        transition-all duration-300
        hover:shadow-2xl hover:shadow-${color}-500/20
        backdrop-blur-sm
      `}>
        <div className={`absolute inset-0 bg-gradient-to-br ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${colors[color].split(' ')[2]}`} />
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                <TrendingUp className={`w-4 h-4 ${change < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
          
          <p className="text-gray-400 text-sm font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
