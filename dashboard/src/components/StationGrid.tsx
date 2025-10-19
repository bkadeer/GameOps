'use client'

import { useState } from 'react'
import type { Station } from '@/types'
import { stationsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import StationCard from './StationCard'
import EditStationModal from './EditStationModal'

interface StationGridProps {
  stations: Station[]
  onStartSession: (station: Station) => void
  onUpdate?: () => void
}

export default function StationGrid({ stations, onStartSession, onUpdate }: StationGridProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editStation, setEditStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(false)

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

  // Sort stations by name to maintain consistent order
  const sortedStations = [...stations].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedStations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          onStartSession={onStartSession}
          onEdit={setEditStation}
          onDelete={() => setDeleteConfirm(station.id)}
        />
      ))}

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
    </div>
  )
}
