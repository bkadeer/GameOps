'use client'

import { Clock, User, Monitor, Pause, StopCircle, Plus } from 'lucide-react'
import type { Session } from '@/types'
import { formatDuration } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface SessionsListProps {
  sessions: Session[]
}

export default function SessionsList({ sessions }: SessionsListProps) {
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({})

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: Record<string, number> = {}
      sessions.forEach((session) => {
        const endTime = new Date(session.scheduled_end_at).getTime()
        const now = Date.now()
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
        newTimeRemaining[session.id] = remaining
      })
      setTimeRemaining(newTimeRemaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [sessions])

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
              <button className="flex-1 bg-[#2D2D2D] hover:bg-[#ed6802] text-[#E5E5E5] py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Extend
              </button>
              <button className="flex-1 bg-[#2D2D2D] hover:bg-red-500 text-[#E5E5E5] py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                <StopCircle className="w-4 h-4" />
                End
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
