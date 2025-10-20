'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { sessionsAPI } from '@/lib/api'
import type { Session } from '@/types'

interface EndSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  session: Session | null
}

export default function EndSessionModal({ isOpen, onClose, onSuccess, session }: EndSessionModalProps) {
  const [loading, setLoading] = useState(false)

  const handleEndSession = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      await sessionsAPI.end(session.id)
      toast.success('Session ended successfully')
      onSuccess()
    } catch (error) {
      console.error('Failed to end session:', error)
      toast.error('Failed to end session')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !session) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 max-w-md w-full border border-neutral-700/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-100">End Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-5 mb-6">
          <p className="text-gray-300">Are you sure you want to end this session?</p>
          <div className="bg-neutral-800/40 rounded-xl p-5 border border-neutral-700/40">
            <p className="text-gray-100 font-semibold mb-2">{session.station_name || session.station?.name || `Station ${session.station_id.slice(0, 8)}`}</p>
            <p className="text-gray-400 text-sm">Created by: {session.user_name || 'Unknown'}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-neutral-800/60 hover:bg-neutral-700/60 text-gray-100 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleEndSession}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Ending...' : 'End Session'}
          </button>
        </div>
      </div>
    </div>
  )
}
