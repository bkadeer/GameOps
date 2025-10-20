'use client'

import { Monitor, Gamepad2, Circle, Play, Edit2, Trash2, Cpu, MemoryStick, Clock, User, Plus, StopCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Station, Session } from '@/types'
import { formatDuration } from '@/lib/utils'

interface StationCardProps {
  station: Station
  session?: Session | null // Optional active session for this station
  onStartSession: (station: Station) => void
  onExtendSession?: (session: Session) => void
  onEndSession?: (session: Session) => void
  onEdit: (station: Station) => void
  onDelete: (station: Station) => void
}

export default function StationCard({ station, session, onStartSession, onExtendSession, onEndSession, onEdit, onDelete }: StationCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  
  // Calculate time remaining for active sessions
  useEffect(() => {
    if (!session) {
      setTimeRemaining(0)
      return
    }
    
    const calculateTime = () => {
      const endTime = new Date(session.scheduled_end_at).getTime()
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
      setTimeRemaining(remaining)
    }
    
    calculateTime()
    const interval = setInterval(calculateTime, 1000)
    return () => clearInterval(interval)
  }, [session])
  
  // Determine permissions
  const canEdit = station.status !== 'IN_SESSION'
  const canDelete = station.status === 'OFFLINE' || station.status === 'MAINTENANCE'
  
  // Status checks
  const isOnline = station.status === 'ONLINE'
  const isInSession = station.status === 'IN_SESSION'
  const isMaintenance = station.status === 'MAINTENANCE'
  const isExpiringSoon = isInSession && timeRemaining > 0 && timeRemaining < 300 // Less than 5 minutes
  
  // Get icon based on station type
  const Icon = station.station_type === 'PC' ? Monitor : Gamepad2
  
  // Status-based styling (SWAPPED: cyan for ONLINE, emerald for IN_SESSION)
  const getStatusColor = () => {
    switch (station.status) {
      case 'ONLINE': return 'text-cyan-500'
      case 'IN_SESSION': return 'text-emerald-500'
      case 'OFFLINE': return 'text-gray-500'
      case 'MAINTENANCE': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusBg = () => {
    switch (station.status) {
      case 'ONLINE': return 'bg-cyan-500/10 border-cyan-500/30'
      case 'IN_SESSION': return 'bg-emerald-500/10 border-emerald-500/30'
      case 'OFFLINE': return 'bg-gray-500/10 border-gray-500/30'
      case 'MAINTENANCE': return 'bg-yellow-500/10 border-yellow-500/30'
      default: return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  const cardBg = isOnline 
    ? 'bg-gradient-to-br from-cyan-950/40 to-neutral-900' 
    : isInSession
    ? 'bg-gradient-to-br from-emerald-950/40 to-neutral-900'
    : isMaintenance
    ? 'bg-gradient-to-br from-yellow-950/40 to-neutral-900'
    : 'bg-gradient-to-br from-neutral-900 to-neutral-800/60'
    
  const cardBorder = isOnline
    ? 'border-cyan-500/30 hover:border-cyan-500/50'
    : isInSession
    ? isExpiringSoon
      ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
      : 'border-emerald-500/30 hover:border-emerald-500/50'
    : isMaintenance
    ? 'border-yellow-500/30 hover:border-yellow-500/50'
    : 'border-neutral-700/40 hover:border-neutral-600/60'

  return (
    <div
      className={`${cardBg} ${cardBorder} rounded-2xl p-6 border transition-all duration-300 group relative hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 overflow-hidden shadow-inner shadow-black/20 ${
        isOnline ? 'shadow-[0_0_12px_1px_rgba(6,182,212,0.2)]' : ''
      } ${
        isInSession ? 'shadow-[0_0_15px_2px_rgba(34,197,94,0.25)]' : ''
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
      
      {/* Emerald Flux - Diagonal flowing energy wave for IN_SESSION */}
      {isInSession && (
        <>
          {/* Main diagonal energy band */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
            style={{ zIndex: 1 }}
          >
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(110deg, transparent 0%, transparent 40%, rgba(0, 255, 133, 0.15) 45%, rgba(0, 255, 133, 0.35) 50%, rgba(0, 119, 85, 0.25) 55%, transparent 60%, transparent 100%)',
                animation: 'emeraldFlux 7s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
          
          {/* Secondary trailing wave for depth */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
            style={{ zIndex: 1 }}
          >
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(110deg, transparent 0%, transparent 35%, rgba(0, 255, 133, 0.08) 42%, rgba(0, 119, 85, 0.15) 48%, transparent 55%, transparent 100%)',
                animation: 'emeraldFlux 7s cubic-bezier(0.4, 0.0, 0.2, 1) infinite',
                animationDelay: '-2s',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
          
          {/* Subtle edge glow for holographic depth */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ zIndex: 1 }}
          >
            <div 
              className="absolute inset-0 rounded-2xl"
              style={{
                boxShadow: 'inset 0 0 60px -10px rgba(0, 255, 133, 0.12), inset 0 -30px 40px -20px rgba(0, 119, 85, 0.18)',
                animation: 'fluxGlow 4s ease-in-out infinite',
              }}
            />
          </div>
          
          {/* Optional: Faint scanline texture for holographic effect */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden opacity-20"
            style={{ zIndex: 1 }}
          >
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 133, 0.03) 2px, rgba(0, 255, 133, 0.03) 4px)',
                animation: 'scanlines 8s linear infinite',
              }}
            />
          </div>
        </>
      )}
      
      {/* Subtle glow effect for online stations */}
      {isOnline && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      )}
      
      {/* Subtle glow effect for in-session stations */}
      {isInSession && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
                ? 'bg-cyan-500/10 ring-2 ring-cyan-500/20 group-hover:ring-cyan-500/40' 
                : isInSession
                ? 'bg-emerald-500/10 ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/40'
                : isMaintenance
                ? 'bg-yellow-500/10 ring-2 ring-yellow-500/20 group-hover:ring-yellow-500/40'
                : 'bg-neutral-800/60 ring-2 ring-neutral-700/30'
            }`}>
              <Icon className={`w-7 h-7 transition-colors ${
                isOnline 
                  ? 'text-cyan-400' 
                  : isInSession
                  ? 'text-emerald-400'
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

        {/* Dynamic Content Section with smooth transitions */}
        {isInSession && session ? (
          // Active Session View
          <div className="space-y-4 animate-fade-in">
            {/* Staff Member Info */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User className="w-3.5 h-3.5" />
              <span>Created by: <span className="text-gray-200 font-semibold">{session.user_name || 'Unknown'}</span></span>
            </div>
            
            {/* Timer Section */}
            <div className="p-5 bg-neutral-950/50 backdrop-blur-sm rounded-xl border border-neutral-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4" />
                  Time Remaining
                </span>
                <span className={`font-mono text-lg tracking-wider font-bold ${
                  isExpiringSoon ? 'text-yellow-400' : 'text-emerald-400'
                }`}>
                  {formatDuration(timeRemaining)}
                </span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                    isExpiringSoon 
                      ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 animate-pulse' 
                      : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300'
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (timeRemaining / (session.duration_minutes * 60)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          // Idle Station View (Specs)
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
        )}

        {/* Action Buttons */}
        <div className="mt-5">
          {isInSession && session ? (
            // Session Control Buttons
            <div className="flex gap-3">
              <button 
                onClick={() => onExtendSession?.(session)}
                className="flex-1 rounded-full px-4 py-2.5 text-sm bg-neutral-800/70 hover:bg-emerald-500/90 text-gray-200 hover:text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg border border-neutral-700/50 hover:border-emerald-500/50"
              >
                <Plus className="w-4 h-4" />
                Extend
              </button>
              <button 
                onClick={() => onEndSession?.(session)}
                className="flex-1 rounded-full px-4 py-2.5 text-sm bg-neutral-800/70 hover:bg-red-500/90 text-gray-200 hover:text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg border border-neutral-700/50 hover:border-red-500/50"
              >
                <StopCircle className="w-4 h-4" />
                End
              </button>
            </div>
          ) : station.status === 'ONLINE' ? (
            // Start Session Button
            <div className="flex justify-center">
              <button 
                onClick={() => onStartSession(station)}
                className="w-2/3 bg-gradient-to-r from-[#ed6802] to-[#ff7a1a] hover:from-[#ff7a1a] hover:to-[#ff8c3a] text-white py-2.5 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#ed6802]/30 border border-[#ff7a1a]/20"
              >
                <Play className="w-4 h-4" />
                Start Session
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
