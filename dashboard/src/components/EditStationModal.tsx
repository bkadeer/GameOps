'use client'

import { useState, useEffect } from 'react'
import { X, Monitor, Gamepad2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { stationsAPI } from '@/lib/api'
import type { Station, StationType, ControlMethod, StationStatus } from '@/types'

interface EditStationModalProps {
  isOpen: boolean
  station: Station | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditStationModal({ isOpen, station, onClose, onSuccess }: EditStationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    station_type: 'PC' as StationType,
    status: 'OFFLINE' as StationStatus,
    location: '',
    ip_address: '',
    mac_address: '',
    control_method: 'AGENT' as ControlMethod,
    control_address: '',
    specs: {
      cpu: '',
      gpu: '',
      ram_gb: '',
    }
  })

  // Populate form when station changes
  useEffect(() => {
    if (station) {
      setFormData({
        name: station.name || '',
        station_type: station.station_type || 'PC',
        status: station.status || 'OFFLINE',
        location: station.location || '',
        ip_address: station.ip_address || '',
        mac_address: station.mac_address || '',
        control_method: station.control_method || 'AGENT',
        control_address: station.control_address || '',
        specs: {
          cpu: station.specs?.cpu || '',
          gpu: station.specs?.gpu || '',
          ram_gb: station.specs?.ram_gb?.toString() || '',
        }
      })
    }
  }, [station])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!station) return

    // Validation
    if (!formData.name.trim()) {
      toast.error('Station name is required')
      return
    }

    // Validate IP address format if provided
    if (formData.ip_address && !/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ip_address)) {
      toast.error('Invalid IP address format')
      return
    }

    // Validate MAC address format if provided
    if (formData.mac_address && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.mac_address)) {
      toast.error('Invalid MAC address format (e.g., 00:00:00:00:00:00)')
      return
    }

    setLoading(true)

    try {
      await stationsAPI.update(station.id, {
        name: formData.name,
        station_type: formData.station_type,
        status: formData.status,
        location: formData.location || undefined,
        ip_address: formData.ip_address || undefined,
        mac_address: formData.mac_address || undefined,
        control_method: formData.control_method,
        control_address: formData.control_address || undefined,
        specs: {
          cpu: formData.specs.cpu || undefined,
          gpu: formData.specs.gpu || undefined,
          ram_gb: formData.specs.ram_gb ? parseInt(formData.specs.ram_gb) : undefined,
        }
      })
      toast.success(`Station "${formData.name}" updated successfully!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to update station'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !station) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#252525] rounded-2xl border border-[#333333] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333333]">
          <div>
            <h2 className="text-xl font-semibold text-[#E5E5E5]">Edit Station</h2>
            <p className="text-sm text-[#A0A0A0] mt-1">Update station details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#A0A0A0]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="text-xs text-[#A0A0A0] flex items-center gap-1">
            <span className="text-[#ed6802]">*</span> Required fields
          </div>

          {/* Station Type */}
          <div>
            <label className="block text-sm font-medium text-[#E5E5E5] mb-3">
              Station Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['PC', 'PS5', 'XBOX', 'SWITCH'] as StationType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, station_type: type })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.station_type === type
                      ? 'border-[#ed6802] bg-[#ed6802]/10'
                      : 'border-[#333333] bg-[#2D2D2D] hover:border-[#444444]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {type === 'PC' ? (
                      <Monitor className="w-5 h-5 text-[#A0A0A0]" />
                    ) : (
                      <Gamepad2 className="w-5 h-5 text-[#A0A0A0]" />
                    )}
                    <span className="text-[#E5E5E5] font-medium">{type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Station Status */}
          <div>
            <label className="block text-sm font-medium text-[#E5E5E5] mb-3">
              Station Status
            </label>
            <div className="grid grid-cols-4 gap-3">
              {(['ONLINE', 'OFFLINE', 'MAINTENANCE'] as StationStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  disabled={station?.status === 'IN_SESSION'}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    formData.status === status
                      ? 'border-[#ed6802] bg-[#ed6802]/10 text-[#ed6802]'
                      : 'border-[#333333] bg-[#2D2D2D] text-[#A0A0A0] hover:border-[#444444]'
                  } ${station?.status === 'IN_SESSION' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {status}
                </button>
              ))}
            </div>
            {station?.status === 'IN_SESSION' && (
              <p className="text-xs text-[#A0A0A0] mt-2">Cannot change status while session is active</p>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#E5E5E5] mb-2">
                Station Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#2D2D2D] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors"
                placeholder="e.g., PC-01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#E5E5E5] mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#2D2D2D] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors"
                placeholder="e.g., Floor 1, Row A"
              />
            </div>
          </div>

          {/* Network Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#E5E5E5] mb-2">
                IP Address
              </label>
              <input
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#2D2D2D] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors"
                placeholder="192.168.1.100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#E5E5E5] mb-2">
                MAC Address
              </label>
              <input
                type="text"
                value={formData.mac_address}
                onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#2D2D2D] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors"
                placeholder="00:00:00:00:00:00"
              />
            </div>
          </div>

          {/* Specs (for PC only) */}
          {formData.station_type === 'PC' && (
            <div>
              <label className="block text-sm font-medium text-[#E5E5E5] mb-3">
                Specifications (Optional)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <input
                    type="text"
                    value={formData.specs.cpu}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      specs: { ...formData.specs, cpu: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 bg-[#2D2D2D] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors"
                    placeholder="CPU"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.specs.gpu}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      specs: { ...formData.specs, gpu: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 bg-[#2D2D2D] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors"
                    placeholder="GPU"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={formData.specs.ram_gb}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      specs: { ...formData.specs, ram_gb: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 bg-[#2D2D2D] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors"
                    placeholder="RAM (GB)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#2D2D2D] hover:bg-[#333333] text-[#E5E5E5] rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#ed6802] hover:bg-[#ff7a1a] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Station'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
