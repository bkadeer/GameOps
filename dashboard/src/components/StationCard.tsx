'use client'

import { Monitor, Gamepad2, Circle, Play, Edit2, Trash2, Cpu, MemoryStick } from 'lucide-react'
import type { Station } from '@/types'

interface StationCardProps {
  station: Station
  onStartSession: (station: Station) => void
  onEdit: (station: Station) => void
  onDelete: (station: Station) => void
}

export default function StationCard({ station, onStartSession, onEdit, onDelete }: StationCardProps) {
  // Determine permissions
  const canEdit = station.status !== 'IN_SESSION'
  const canDelete = station.status === 'OFFLINE' || station.status === 'MAINTENANCE'
  
  // Status checks
  const isOnline = station.status === 'ONLINE'
  const isInSession = station.status === 'IN_SESSION'
  const isMaintenance = station.status === 'MAINTENANCE'
  
  // Get icon based on station type
  const Icon = station.station_type === 'PC' ? Monitor : Gamepad2
  
  // Status-based styling
  const getStatusColor = () => {
    switch (station.status) {
      case 'ONLINE': return 'text-emerald-500'
      case 'IN_SESSION': return 'text-cyan-500'
      case 'OFFLINE': return 'text-gray-500'
      case 'MAINTENANCE': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusBg = () => {
    switch (station.status) {
      case 'ONLINE': return 'bg-emerald-500/10 border-emerald-500/30'
      case 'IN_SESSION': return 'bg-cyan-500/10 border-cyan-500/30'
      case 'OFFLINE': return 'bg-gray-500/10 border-gray-500/30'
      case 'MAINTENANCE': return 'bg-yellow-500/10 border-yellow-500/30'
      default: return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  const cardBg = isOnline 
    ? 'bg-gradient-to-br from-emerald-950/40 to-neutral-900' 
    : isInSession
    ? 'bg-gradient-to-br from-cyan-950/40 to-neutral-900'
    : isMaintenance
    ? 'bg-gradient-to-br from-yellow-950/40 to-neutral-900'
    : 'bg-gradient-to-br from-neutral-900 to-neutral-800/60'
    
  const cardBorder = isOnline
    ? 'border-emerald-500/30 hover:border-emerald-500/50'
    : isInSession
    ? 'border-cyan-500/30 hover:border-cyan-500/50'
    : isMaintenance
    ? 'border-yellow-500/30 hover:border-yellow-500/50'
    : 'border-neutral-700/40 hover:border-neutral-600/60'

  return (
    <div
      className={`${cardBg} ${cardBorder} rounded-2xl p-6 border transition-all duration-300 group relative hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 overflow-hidden shadow-inner shadow-black/20 ${
        isOnline ? 'shadow-[0_0_12px_1px_rgba(34,197,94,0.2)]' : ''
      }`}
    >
      {/* Action Buttons */}
      {(canEdit || canDelete) && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {canEdit && (
            <button
              onClick={() => onEdit(station)}
              className="p-2.5 bg-neutral-800/90 backdrop-blur-sm hover:bg-[#ed6802] text-gray-400 hover:text-white rounded-xl transition-all duration-300 hover:scale-110 border border-neutral-700/50 hover:border-[#ed6802]/50 shadow-lg"
              title="Edit Station"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(station)}
              className="p-2.5 bg-neutral-800/90 backdrop-blur-sm hover:bg-red-500 text-gray-400 hover:text-white rounded-xl transition-all duration-300 hover:scale-110 border border-neutral-700/50 hover:border-red-500/50 shadow-lg"
              title="Delete Station"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      {/* Top glow effect for IN_SESSION */}
      {isInSession && (
        <div 
          className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-2xl"
          style={{ zIndex: 5 }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            style={{
              animation: 'shimmer 2s linear infinite',
              backgroundSize: '200% 100%'
            }}
          />
        </div>
      )}
      
      {/* Subtle glow effect for online stations */}
      {isOnline && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      )}
      
      {/* Subtle glow effect for in-session stations */}
      {isInSession && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      )}
      
      {/* Subtle glow effect for maintenance stations */}
      {isMaintenance && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isOnline 
                ? 'bg-emerald-500/10 ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/40' 
                : isInSession
                ? 'bg-cyan-500/10 ring-2 ring-cyan-500/20 group-hover:ring-cyan-500/40'
                : isMaintenance
                ? 'bg-yellow-500/10 ring-2 ring-yellow-500/20 group-hover:ring-yellow-500/40'
                : 'bg-neutral-800/60 ring-2 ring-neutral-700/30'
            }`}>
              <Icon className={`w-7 h-7 transition-colors ${
                isOnline 
                  ? 'text-emerald-400' 
                  : isInSession
                  ? 'text-cyan-400'
                  : isMaintenance
                  ? 'text-yellow-400'
                  : 'text-gray-500'
              }`} />
            </div>
            <div>
              <h3 className="text-gray-100 font-bold text-lg tracking-tight">{station.name}</h3>
              <p className="text-gray-400 text-sm font-medium">{station.station_type}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusBg()}`}>
            <Circle className={`w-2 h-2 fill-current ${getStatusColor()} ${
              isOnline || isInSession ? 'animate-[blink_1.8s_ease-in-out_infinite]' : ''
            }`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${getStatusColor()}`}>
              {station.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Specs Section */}
        <div className="space-y-3 p-5 bg-neutral-950/50 backdrop-blur-sm rounded-xl border border-neutral-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-2 font-medium">
              <Monitor className="w-4 h-4" />
              Location
            </span>
            <span className="text-gray-200 text-right truncate font-semibold">{station.location}</span>
          </div>
          {station.specs && (
            <>
              {station.specs.cpu && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2 font-medium">
                    <Cpu className="w-4 h-4" />
                    CPU
                  </span>
                  <span className="text-gray-200 text-right truncate font-semibold text-xs">{station.specs.cpu}</span>
                </div>
              )}
              {station.specs.ram_gb && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2 font-medium">
                    <MemoryStick className="w-4 h-4" />
                    RAM
                  </span>
                  <span className="text-gray-200 text-right font-semibold">{station.specs.ram_gb}GB</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Start Session Button */}
        {station.status === 'ONLINE' && (
          <div className="flex justify-center mt-5">
            <button 
              onClick={() => onStartSession(station)}
              className="w-2/3 bg-gradient-to-r from-[#ed6802] to-[#ff7a1a] hover:from-[#ff7a1a] hover:to-[#ff8c3a] text-white py-2.5 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#ed6802]/30 border border-[#ff7a1a]/20"
            >
              <Play className="w-4 h-4" />
              Start Session
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
