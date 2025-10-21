'use client'

import { useState } from 'react'
import type { Station, Session } from '@/types'
import { stationsAPI, sessionsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import StationCard from './StationCard'
import EditStationModal from './EditStationModal'
import ExtendSessionModal from './ExtendSessionModal'
import EndSessionModal from './EndSessionModal'

interface StationGridProps {
  stations: Station[]
  sessions: Session[] // Add sessions to map to stations
  onStartSession: (station: Station) => void
  onUpdate?: () => void
  activeFilter?: 'active' | 'available' | null
}

export default function StationGrid({ stations, sessions, onStartSession, onUpdate, activeFilter }: StationGridProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editStation, setEditStation] = useState<Station | null>(null)
  const [extendSession, setExtendSession] = useState<Session | null>(null)
  const [endSession, setEndSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Create a map of station_id -> session for quick lookup
  const sessionMap = new Map(sessions.map(s => [s.station_id, s]))
  
  // Filter stations based on active filter
  const filteredStations = stations.filter(station => {
    if (!activeFilter) return true
    
    const hasActiveSession = sessionMap.has(station.id)
    
    if (activeFilter === 'active') {
      return hasActiveSession
    } else if (activeFilter === 'available') {
      return station.status === 'ONLINE' && !hasActiveSession
    }
    
    return true
  })

  const handleDelete = async (station: Station) => {
    if (station.status === 'IN_SESSION') {
      toast.error('Cannot delete station with active session')
      return
    }

    setLoading(true)
    try {
      await stationsAPI.delete(station.id)
      toast.success(`Station "${station.name}" deleted successfully`)
      setDeleteConfirm(null)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to delete station:', error)
      toast.error('Failed to delete station')
    } finally {
      setLoading(false)
    }
  }

  // Sort filtered stations by name to maintain consistent order
  const sortedStations = [...filteredStations].sort((a, b) => a.name.localeCompare(b.name))
  
  // Determine if stations should pulse (when filter is active)
  const shouldPulse = activeFilter !== null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedStations.map((station) => {
        const stationSession = sessionMap.get(station.id)
        return (
          <div 
            key={station.id}
            className={`transition-all duration-500 ${shouldPulse ? 'animate-pulse-subtle' : ''}`}
          >
            <StationCard
              station={station}
              session={stationSession}
              onStartSession={onStartSession}
              onExtendSession={setExtendSession}
              onEndSession={setEndSession}
              onEdit={setEditStation}
              onDelete={() => setDeleteConfirm(station.id)}
              onUpdate={onUpdate}
            />
          </div>
        )
      })}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252525] rounded-2xl p-6 max-w-md w-full border border-[#333333]">
            <h2 className="text-xl font-bold text-[#E5E5E5] mb-4">Delete Station</h2>
            <p className="text-[#A0A0A0] mb-6">
              Are you sure you want to delete station <span className="text-[#E5E5E5] font-semibold">{stations.find(s => s.id === deleteConfirm)?.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
                className="flex-1 bg-[#2D2D2D] hover:bg-[#333333] text-[#E5E5E5] py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const station = stations.find(s => s.id === deleteConfirm)
                  if (station) handleDelete(station)
                }}
                disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Station Modal */}
      <EditStationModal
        isOpen={!!editStation}
        station={editStation}
        onClose={() => setEditStation(null)}
        onSuccess={() => {
          setEditStation(null)
          if (onUpdate) onUpdate()
        }}
      />
      
      {/* Extend Session Modal */}
      <ExtendSessionModal
        isOpen={!!extendSession}
        session={extendSession}
        onClose={() => setExtendSession(null)}
        onSuccess={() => {
          setExtendSession(null)
          if (onUpdate) onUpdate()
        }}
      />
      
      {/* End Session Modal */}
      <EndSessionModal
        isOpen={!!endSession}
        session={endSession}
        onClose={() => setEndSession(null)}
        onSuccess={() => {
          setEndSession(null)
          if (onUpdate) onUpdate()
        }}
      />
    </div>
  )
}
