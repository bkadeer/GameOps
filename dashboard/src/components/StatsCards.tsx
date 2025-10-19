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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-4 sm:p-5 md:p-6 border border-neutral-700/50 hover:border-neutral-600/80 transition-all duration-300 group overflow-hidden hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30 shadow-inner shadow-black/20"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Gradient accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-60 group-hover:opacity-100 transition-opacity`}></div>
            
            {/* Subtle glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5 md:mb-6">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/10`}>
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2 tracking-wide uppercase leading-snug">{card.title}</p>
                <p className="text-gray-100 text-3xl md:text-4xl font-bold tracking-tight leading-snug">{card.value}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
