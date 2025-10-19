'use client'

import { Monitor, Activity, DollarSign, Users, TrendingUp } from 'lucide-react'
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
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-950/40 to-neutral-900',
      iconBg: 'bg-blue-500/10',
      iconRing: 'ring-blue-500/20',
      iconColor: 'text-blue-400',
      accentColor: 'bg-blue-500',
    },
    {
      title: 'Active Sessions',
      value: stats.active_sessions,
      icon: Activity,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-950/40 to-neutral-900',
      iconBg: 'bg-emerald-500/10',
      iconRing: 'ring-emerald-500/20',
      iconColor: 'text-emerald-400',
      accentColor: 'bg-emerald-500',
    },
    {
      title: 'Available Stations',
      value: stats.available_stations,
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-950/40 to-neutral-900',
      iconBg: 'bg-purple-500/10',
      iconRing: 'ring-purple-500/20',
      iconColor: 'text-purple-400',
      accentColor: 'bg-purple-500',
    },
    {
      title: 'Today Revenue',
      value: formatCurrency(stats.revenue_today),
      icon: DollarSign,
      gradient: 'from-[#ed6802] to-[#ff7a1a]',
      bgGradient: 'from-orange-950/40 to-neutral-900',
      iconBg: 'bg-[#ed6802]/10',
      iconRing: 'ring-[#ed6802]/20',
      iconColor: 'text-[#ff7a1a]',
      accentColor: 'bg-[#ed6802]',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`relative bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 border border-neutral-700/40 hover:border-neutral-600/60 transition-all duration-300 group overflow-hidden hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 shadow-inner shadow-black/20 animate-fade-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}></div>
            
            {/* Hover glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>
            
            {/* Floating particles effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className={`absolute top-1/4 right-1/4 w-2 h-2 ${card.accentColor} rounded-full blur-sm animate-pulse`} style={{ animationDuration: '2s' }}></div>
              <div className={`absolute bottom-1/3 left-1/3 w-1.5 h-1.5 ${card.accentColor} rounded-full blur-sm animate-pulse`} style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
            </div>
            
            <div className="relative z-10">
              {/* Icon and trend indicator */}
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 ring-2 ${card.iconRing} group-hover:ring-4`}>
                  <Icon className={`w-7 h-7 ${card.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                </div>
                
                {/* Trend indicator (placeholder for future enhancement) */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">+12%</span>
                </div>
              </div>
              
              {/* Title and value */}
              <div>
                <p className="text-gray-400 text-sm font-medium mb-2 tracking-wide uppercase">{card.title}</p>
                <p className="text-gray-100 text-4xl font-bold tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">{card.value}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
