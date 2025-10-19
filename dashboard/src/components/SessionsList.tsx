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
      <div className="bg-[#252525] rounded-2xl p-12 border border-[#333333] text-center">
        <Monitor className="w-12 h-12 text-[#A0A0A0] mx-auto mb-4" />
        <p className="text-[#A0A0A0]">No active sessions</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {sessions.map((session) => {
        const remaining = timeRemaining[session.id] || 0
        const isExpiringSoon = remaining < 300 // Less than 5 minutes

        return (
          <div
            key={session.id}
            className={`bg-[#252525] rounded-2xl p-5 border transition-all duration-300 ${
              isExpiringSoon ? 'border-yellow-500/50' : 'border-[#333333] hover:border-[#ed6802]/50'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ed6802]/10 rounded-xl flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-[#ed6802]" />
                </div>
                <div>
                  <h3 className="text-[#E5E5E5] font-semibold">Station {session.station_id.slice(0, 8)}</h3>
                  <p className="text-[#A0A0A0] text-sm flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {session.user_id ? session.user_id.slice(0, 8) : 'Walk-in'}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full ${isExpiringSoon ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                <span className={`text-xs font-medium ${isExpiringSoon ? 'text-yellow-500' : 'text-green-500'}`}>
                  {session.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[#A0A0A0] text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Remaining
                </span>
                <span className={`font-semibold ${isExpiringSoon ? 'text-yellow-500' : 'text-[#E5E5E5]'}`}>
                  {formatDuration(remaining)}
                </span>
              </div>
              <div className="w-full bg-[#1C1C1C] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    isExpiringSoon ? 'bg-yellow-500' : 'bg-[#ed6802]'
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (remaining / (session.duration_minutes * 60)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleExtendClick(session)}
                className="flex-1 bg-[#2D2D2D] hover:bg-[#ed6802] text-[#E5E5E5] py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Extend
              </button>
              <button 
                onClick={() => handleEndClick(session)}
                className="flex-1 bg-[#2D2D2D] hover:bg-red-500 text-[#E5E5E5] py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                End
              </button>
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
