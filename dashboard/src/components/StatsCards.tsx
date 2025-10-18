'use client'

import { Monitor, Activity, DollarSign, Users } from 'lucide-react'
import type { DashboardStats } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface StatsCardsProps {
  stats: DashboardStats | null
}

export default function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null

  const cards = [
    {
      title: 'Total Stations',
      value: stats.total_stations,
      icon: Monitor,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Active Sessions',
      value: stats.active_sessions,
      icon: Activity,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Available Stations',
      value: stats.available_stations,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Today Revenue',
      value: formatCurrency(stats.revenue_today),
      icon: DollarSign,
      color: 'from-[#ed6802] to-[#ff7a1a]',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className="bg-[#252525] rounded-2xl p-6 border border-[#333333] hover:border-[#ed6802]/50 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-[#A0A0A0] text-sm mb-1">{card.title}</p>
              <p className="text-[#E5E5E5] text-3xl font-semibold">{card.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
