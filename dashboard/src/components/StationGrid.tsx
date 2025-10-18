'use client'

import { Monitor, Gamepad2, Circle, Play, Edit2, Trash2 } from 'lucide-react'
import type { Station } from '@/types'
import { useState } from 'react'
import { stationsAPI } from '@/lib/api'
import toast from 'react-hot-toast'
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'text-green-500'
      case 'IN_SESSION':
        return 'text-[#ed6802]'
      case 'OFFLINE':
        return 'text-gray-500'
      case 'MAINTENANCE':
        return 'text-yellow-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500/10 border-green-500/30'
      case 'IN_SESSION':
        return 'bg-[#ed6802]/10 border-[#ed6802]/30'
      case 'OFFLINE':
        return 'bg-gray-500/10 border-gray-500/30'
      case 'MAINTENANCE':
        return 'bg-yellow-500/10 border-yellow-500/30'
      default:
        return 'bg-gray-500/10 border-gray-500/30'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'PC':
        return Monitor
      default:
        return Gamepad2
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {stations.map((station) => {
        const Icon = getIcon(station.station_type)
        // Can edit any station except those in active session
        const canEdit = station.status !== 'IN_SESSION'
        // Can only delete OFFLINE or MAINTENANCE stations
        const canDelete = station.status === 'OFFLINE' || station.status === 'MAINTENANCE'
        return (
          <div
            key={station.id}
            className="bg-[#252525] rounded-2xl p-8 border border-[#333333] hover:border-[#ed6802]/50 transition-all duration-300 group relative"
          >
            {/* Action Buttons */}
            {(canEdit || canDelete) && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {canEdit && (
                  <button
                    onClick={() => setEditStation(station)}
                    className="p-2 bg-[#2D2D2D] hover:bg-[#ed6802] text-[#A0A0A0] hover:text-white rounded-lg transition-colors"
                    title="Edit Station"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setDeleteConfirm(station.id)}
                    className="p-2 bg-[#2D2D2D] hover:bg-red-500 text-[#A0A0A0] hover:text-white rounded-lg transition-colors"
                    title="Delete Station"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#2D2D2D] rounded-xl flex items-center justify-center group-hover:bg-[#ed6802]/10 transition-colors">
                  <Icon className="w-7 h-7 text-[#A0A0A0] group-hover:text-[#ed6802] transition-colors" />
                </div>
                <div>
                  <h3 className="text-[#E5E5E5] font-bold text-lg tracking-wide">{station.name}</h3>
                  <p className="text-[#A0A0A0] text-sm font-medium tracking-wide">{station.station_type}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusBg(station.status)}`}>
                <Circle className={`w-2.5 h-2.5 fill-current ${getStatusColor(station.status)}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(station.status)}`}>
                  {station.status}
                </span>
              </div>
            </div>

            {/* Specs Section with Enhanced Padding */}
            <div className="space-y-4 px-8 py-6 bg-[#1C1C1C] rounded-2xl border-2 border-[#2a2a2a]">
              <div className="flex items-center justify-between text-base gap-6">
                <span className="text-[#A0A0A0] flex-shrink-0 font-semibold tracking-wide">Location</span>
                <span className="text-[#E5E5E5] text-right truncate font-medium tracking-wide">{station.location}</span>
              </div>
              {station.specs && (
                <>
                  {station.specs.cpu && (
                    <div className="flex items-center justify-between text-base gap-6">
                      <span className="text-[#A0A0A0] flex-shrink-0 font-semibold tracking-wide">CPU</span>
                      <span className="text-[#E5E5E5] text-sm text-right truncate font-medium tracking-wide">{station.specs.cpu}</span>
                    </div>
                  )}
                  {station.specs.ram_gb && (
                    <div className="flex items-center justify-between text-base gap-6">
                      <span className="text-[#A0A0A0] flex-shrink-0 font-semibold tracking-wide">RAM</span>
                      <span className="text-[#E5E5E5] text-right font-medium tracking-wide">{station.specs.ram_gb}GB</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {station.status === 'ONLINE' && (
              <button 
                onClick={() => onStartSession(station)}
                className="w-full mt-4 bg-[#ed6802] hover:bg-[#ff7a1a] text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Session
              </button>
            )}
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
    </div>
  )
}
