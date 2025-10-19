'use client'

import { Clock, User, Monitor, Pause, StopCircle, Plus, X } from 'lucide-react'
import type { Session } from '@/types'
import { formatDuration } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { sessionsAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface SessionsListProps {
  sessions: Session[]
  onUpdate?: () => void
}

export default function SessionsList({ sessions, onUpdate }: SessionsListProps) {
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({})
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [extendMinutes, setExtendMinutes] = useState(30)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Calculate immediately on mount/update
    const calculateTimeRemaining = () => {
      const newTimeRemaining: Record<string, number> = {}
      sessions.forEach((session) => {
        const endTime = new Date(session.scheduled_end_at).getTime()
        const now = Date.now()
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
        newTimeRemaining[session.id] = remaining
      })
      setTimeRemaining(newTimeRemaining)
    }

    // Calculate immediately
    calculateTimeRemaining()

    // Then update every second
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [sessions])

  const handleExtendClick = (session: Session) => {
    setSelectedSession(session)
    setShowExtendModal(true)
  }

  const handleEndClick = (session: Session) => {
    setSelectedSession(session)
    setShowEndModal(true)
  }

  const handleExtendSession = async () => {
    if (!selectedSession) return
    
    setLoading(true)
    try {
      await sessionsAPI.extend(
        selectedSession.id,
        extendMinutes,
        'CASH', // Default payment method
        0 // Amount will be calculated by backend
      )
      toast.success(`Session extended by ${extendMinutes} minutes`)
      setShowExtendModal(false)
      setSelectedSession(null)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to extend session:', error)
      toast.error('Failed to extend session')
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!selectedSession) return
    
    setLoading(true)
    try {
      await sessionsAPI.end(selectedSession.id)
      toast.success('Session ended successfully')
      setShowEndModal(false)
      setSelectedSession(null)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to end session:', error)
      toast.error('Failed to end session')
    } finally {
      setLoading(false)
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="relative bg-gradient-to-br from-neutral-900/60 to-neutral-800/50 backdrop-blur-md rounded-2xl p-12 border border-neutral-700/50 text-center shadow-inner shadow-black/20">
        <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">No active sessions</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {sessions.map((session) => {
        const remaining = timeRemaining[session.id] || 0
        const isExpiringSoon = remaining < 300 // Less than 5 minutes

        return (
          <div
            key={session.id}
            className={`relative bg-gradient-to-br from-neutral-900/60 to-neutral-800/50 backdrop-blur-md rounded-2xl p-4 sm:p-5 md:p-6 border transition-all duration-300 shadow-inner shadow-black/20 group ${
              isExpiringSoon 
                ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                : 'border-cyan-500/50 hover:border-cyan-400/60 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]'
            }`}
          >
            {/* Subtle glow effect on hover */}
            {isExpiringSoon ? (
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            )}
            
            <div className="relative z-10">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-cyan-500/10 rounded-xl flex items-center justify-center ring-2 ring-cyan-500/20">
                  <Monitor className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-gray-100 font-bold tracking-tight">Station {session.station_id.slice(0, 8)}</h3>
                  <p className="text-gray-400 text-sm flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5" />
                    {session.user_id ? session.user_id.slice(0, 8) : 'Walk-in'}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full border ${isExpiringSoon ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${isExpiringSoon ? 'text-yellow-400' : 'text-cyan-400'}`}>
                  {session.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4" />
                  Time Remaining
                </span>
                <span className={`font-mono text-lg tracking-wider font-bold ${
                  isExpiringSoon ? 'text-yellow-400' : 'text-cyan-400'
                }`}>
                  {formatDuration(remaining)}
                </span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                    isExpiringSoon 
                      ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 animate-pulse' 
                      : 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300 animate-[pulse_2s_infinite]'
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (remaining / (session.duration_minutes * 60)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handleExtendClick(session)}
                className="flex-1 rounded-full px-5 py-2 text-sm bg-neutral-800/70 hover:bg-cyan-500/90 text-gray-200 hover:text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg border border-neutral-700/50 hover:border-cyan-500/50"
              >
                <Plus className="w-4 h-4" />
                Extend
              </button>
              <button 
                onClick={() => handleEndClick(session)}
                className="flex-1 rounded-full px-5 py-2 text-sm bg-neutral-800/70 hover:bg-red-500/90 text-gray-200 hover:text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg border border-neutral-700/50 hover:border-red-500/50"
              >
                <StopCircle className="w-4 h-4" />
                End
              </button>
            </div>
            </div>
          </div>
        )
      })}

      {/* Extend Session Modal */}
      {showExtendModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252525] rounded-2xl p-6 max-w-md w-full border border-[#333333]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#E5E5E5]">Extend Session</h2>
              <button
                onClick={() => setShowExtendModal(false)}
                className="text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-[#A0A0A0] text-sm mb-2">Station</p>
                <p className="text-[#E5E5E5] font-semibold">Station {selectedSession.station_id.slice(0, 8)}</p>
              </div>

              <div>
                <label className="text-[#A0A0A0] text-sm block mb-2">Additional Time (minutes)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 60, 120].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setExtendMinutes(minutes)}
                      className={`py-2 rounded-lg font-medium transition-colors ${
                        extendMinutes === minutes
                          ? 'bg-[#ed6802] text-white'
                          : 'bg-[#2D2D2D] text-[#E5E5E5] hover:bg-[#333333]'
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExtendModal(false)}
                disabled={loading}
                className="flex-1 bg-[#2D2D2D] hover:bg-[#333333] text-[#E5E5E5] py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendSession}
                disabled={loading}
                className="flex-1 bg-[#ed6802] hover:bg-[#ff7a1a] text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Extending...' : `Extend ${extendMinutes}m`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Modal */}
      {showEndModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252525] rounded-2xl p-6 max-w-md w-full border border-[#333333]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#E5E5E5]">End Session</h2>
              <button
                onClick={() => setShowEndModal(false)}
                className="text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-[#A0A0A0]">Are you sure you want to end this session?</p>
              <div className="bg-[#2D2D2D] rounded-xl p-4">
                <p className="text-[#E5E5E5] font-semibold mb-2">Station {selectedSession.station_id.slice(0, 8)}</p>
                <p className="text-[#A0A0A0] text-sm">Time remaining: {formatDuration(timeRemaining[selectedSession.id] || 0)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEndModal(false)}
                disabled={loading}
                className="flex-1 bg-[#2D2D2D] hover:bg-[#333333] text-[#E5E5E5] py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
