'use client'

import { Monitor, Activity, DollarSign, CheckCircle, Zap, TrendingUp } from 'lucide-react'
import type { DashboardStats } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface StatsCardsProps {
  stats: DashboardStats | null
  activeFilter?: 'active' | 'available' | null
  onFilterChange?: (filter: 'active' | 'available') => void
}

export default function StatsCards({ stats, activeFilter, onFilterChange }: StatsCardsProps) {
  if (!stats) return null
  
  const handleCardClick = (filterType: 'active' | 'available' | null) => {
    if (filterType && onFilterChange) {
      onFilterChange(filterType)
    }
  }

  const cards = [
    {
      title: 'Total Stations',
      value: stats.total_stations,
      icon: Monitor,
      gradient: 'from-cyan-500/20 via-blue-500/20 to-cyan-500/20',
      glowColor: 'shadow-cyan-500/50',
      borderGlow: 'group-hover:border-cyan-500/60',
      iconBg: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10',
      iconColor: 'text-cyan-400',
      valueColor: 'text-white',
      accentColor: 'bg-cyan-500',
      pulseColor: 'bg-cyan-400',
      filterType: null,
      clickable: false,
    },
    {
      title: 'Active Sessions',
      value: stats.active_sessions,
      icon: Activity,
      gradient: 'from-emerald-500/20 via-green-500/20 to-emerald-500/20',
      glowColor: 'shadow-emerald-500/50',
      borderGlow: 'group-hover:border-emerald-500/60',
      iconBg: 'bg-gradient-to-br from-emerald-500/10 to-green-500/10',
      iconColor: 'text-emerald-400',
      valueColor: 'text-white',
      accentColor: 'bg-emerald-500',
      pulseColor: 'bg-emerald-400',
      animate: true,
      filterType: 'active' as const,
      clickable: true,
    },
    {
      title: 'Available Stations',
      value: stats.available_stations,
      icon: stats.available_stations === 0 ? Zap : CheckCircle,
      gradient: stats.available_stations === 0 
        ? 'from-red-500/20 via-rose-500/20 to-red-500/20'
        : 'from-violet-500/20 via-purple-500/20 to-violet-500/20',
      glowColor: stats.available_stations === 0 ? 'shadow-red-500/50' : 'shadow-violet-500/50',
      borderGlow: stats.available_stations === 0 
        ? 'group-hover:border-red-500/60' 
        : 'group-hover:border-violet-500/60',
      iconBg: stats.available_stations === 0
        ? 'bg-gradient-to-br from-red-500/10 to-rose-500/10'
        : 'bg-gradient-to-br from-violet-500/10 to-purple-500/10',
      iconColor: stats.available_stations === 0 ? 'text-red-400' : 'text-violet-400',
      valueColor: stats.available_stations === 0 ? 'text-red-400' : 'text-white',
      accentColor: stats.available_stations === 0 ? 'bg-red-500' : 'bg-violet-500',
      pulseColor: stats.available_stations === 0 ? 'bg-red-400' : 'bg-violet-400',
      warning: stats.available_stations === 0,
      filterType: 'available' as const,
      clickable: true,
    },
    {
      title: 'Today Revenue',
      subtitle: '6AM-6AM',
      value: formatCurrency(stats.revenue_today),
      icon: DollarSign,
      gradient: 'from-amber-500/20 via-orange-500/20 to-amber-500/20',
      glowColor: 'shadow-amber-500/50',
      borderGlow: 'group-hover:border-amber-500/60',
      iconBg: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10',
      iconColor: 'text-amber-400',
      valueColor: 'text-white',
      accentColor: 'bg-amber-500',
      pulseColor: 'bg-amber-400',
      shimmer: true,
      filterType: null,
      clickable: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, index) => {
        const Icon = card.icon
        const isLastCard = index === cards.length - 1
        const isActive = activeFilter === card.filterType && card.filterType !== null
        const isInactive = activeFilter !== null && activeFilter !== card.filterType
        
        return (
          <div key={card.title} className="relative group">
            {/* Card Container */}
            <div 
              className={`
                relative bg-gradient-to-br from-[#1a1a1a] via-[#1e1e1e] to-[#1a1a1a]
                rounded-2xl p-5 border transition-all duration-500 overflow-hidden backdrop-blur-sm animate-fade-in
                ${isActive 
                  ? `border-${card.iconColor.replace('text-', '')} shadow-2xl ${card.glowColor} scale-105` 
                  : isInactive 
                    ? 'border-neutral-700/20 opacity-50' 
                    : `border-neutral-700/30 ${card.borderGlow} hover:shadow-2xl ${card.glowColor}`
                }
                ${card.clickable ? 'cursor-pointer' : ''}
              `}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => card.clickable && handleCardClick(card.filterType)}
            >
              {/* Animated gradient overlay */}
              <div className={`
                absolute inset-0 bg-gradient-to-br ${card.gradient}
                transition-opacity duration-500
                ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              `} />
              
              {/* Top accent line with pulse */}
              <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
                <div className={`
                  h-full ${card.accentColor} 
                  ${card.animate ? 'animate-pulse' : ''}
                  group-hover:animate-shimmer
                `} />
              </div>

              {/* Shimmer effect for revenue card */}
              {card.shimmer && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
              )}

              {/* Floating particles */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className={`absolute top-1/4 right-1/4 w-1 h-1 ${card.pulseColor} rounded-full blur-[1px] animate-float`} 
                     style={{ animationDuration: '3s', animationDelay: '0s' }} />
                <div className={`absolute bottom-1/3 left-1/3 w-1 h-1 ${card.pulseColor} rounded-full blur-[1px] animate-float`} 
                     style={{ animationDuration: '4s', animationDelay: '1s' }} />
                <div className={`absolute top-1/2 right-1/3 w-0.5 h-0.5 ${card.pulseColor} rounded-full blur-[1px] animate-float`} 
                     style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
              </div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center justify-between gap-4">
                {/* Icon with glow */}
                <div className="flex-shrink-0 relative">
                  <div className={`
                    w-12 h-12 rounded-xl ${card.iconBg} 
                    flex items-center justify-center
                    group-hover:scale-110 transition-all duration-300
                    border border-white/5 group-hover:border-white/10
                    shadow-lg
                  `}>
                    <Icon className={`w-6 h-6 ${card.iconColor} ${card.animate ? 'animate-pulse' : ''} transition-transform group-hover:scale-110`} />
                    
                    {/* Icon glow on hover */}
                    <div className={`absolute inset-0 ${card.iconBg} rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />
                  </div>
                  
                  {/* Warning indicator for zero available stations */}
                  {card.warning && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  )}
                </div>
                
                {/* Text and Value */}
                <div className="flex-1 text-right space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-gray-400 text-[10px] font-semibold tracking-wider uppercase">
                      {card.title}
                    </p>
                    {card.subtitle && (
                      <span className="text-gray-500 text-[9px] font-medium px-1.5 py-0.5 bg-neutral-800/60 rounded">
                        {card.subtitle}
                      </span>
                    )}
                  </div>
                  <p className={`
                    ${card.valueColor} text-3xl font-bold tracking-tight
                    group-hover:scale-105 transition-transform duration-300 origin-right
                    drop-shadow-lg
                  `}>
                    {card.value}
                  </p>
                  
                  {/* Micro trend indicator */}
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-semibold">Live</span>
                  </div>
                </div>
              </div>

              {/* Bottom glow line */}
              <div className={`
                absolute bottom-0 left-0 right-0 h-[1px] ${card.accentColor}
                opacity-0 group-hover:opacity-30 transition-opacity duration-300
                blur-sm
              `} />
            </div>
            
            {/* Vertical divider line between cards */}
            {!isLastCard && (
              <div className="hidden lg:block absolute top-1/2 -right-2.5 transform -translate-y-1/2 w-[1px] h-16 bg-gradient-to-b from-transparent via-neutral-700/40 to-transparent" />
            )}
          </div>
        )
      })}
    </div>
  )
}
