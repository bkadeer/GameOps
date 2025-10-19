'use client'

import { useState } from 'react'
import { X, Monitor, Gamepad2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { stationsAPI } from '@/lib/api'
import type { StationType } from '@/types'

interface AddStationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddStationModal({ isOpen, onClose, onSuccess }: AddStationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    station_type: 'PC' as StationType,
    location: '',
    ip_address: '',
    mac_address: '',
    control_method: 'AGENT' as const,
    control_address: '',
    specs: {
      cpu: '',
      gpu: '',
      ram_gb: '',
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      toast.error('Station name is required')
      return
    }

    if (!formData.location.trim()) {
      toast.error('Location is required')
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
      await stationsAPI.create({
        name: formData.name,
        station_type: formData.station_type,
        location: formData.location || undefined,
        ip_address: formData.ip_address || undefined,
        mac_address: formData.mac_address || undefined,
        control_method: 'AGENT',
        control_address: formData.control_address || undefined,
        specs: {
          cpu: formData.specs.cpu || undefined,
          gpu: formData.specs.gpu || undefined,
          ram_gb: formData.specs.ram_gb ? parseInt(formData.specs.ram_gb) : undefined,
        }
      })
      toast.success(`Station "${formData.name}" created successfully!`)
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        name: '',
        station_type: 'PC' as StationType,
        location: '',
        ip_address: '',
        mac_address: '',
        control_method: 'AGENT' as const,
        control_address: '',
        specs: { cpu: '', gpu: '', ram_gb: '' }
      })
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to create station'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700/50 shadow-2xl shadow-black/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700/50 bg-gradient-to-r from-neutral-900/50 to-neutral-800/50">
          <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Add New Station</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-xl transition-all duration-300 hover:scale-110 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-gradient-to-br from-neutral-900/40 to-neutral-800/40">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="text-xs text-gray-400 flex items-center gap-1.5 bg-neutral-800/50 px-3 py-2 rounded-lg border border-neutral-700/30">
            <span className="text-[#ed6802] font-bold">*</span> Required fields
          </div>

          {/* Station Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-100 mb-3 tracking-tight">
              Station Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['PC', 'PS5', 'XBOX', 'SWITCH'] as StationType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, station_type: type })}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.station_type === type
                      ? 'border-[#ed6802] bg-[#ed6802]/10 shadow-lg shadow-[#ed6802]/20 scale-105'
                      : 'border-neutral-700/50 bg-neutral-800/50 hover:border-neutral-600 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3" >
                    {type === 'PC' ? (
                      <Monitor className={`w-5 h-5 transition-colors ${
                        formData.station_type === type ? 'text-[#ed6802]' : 'text-gray-400'
                      }`} />
                    ) : (
                      <Gamepad2 className={`w-5 h-5 transition-colors ${
                        formData.station_type === type ? 'text-[#ed6802]' : 'text-gray-400'
                      }`} />
                    )}
                    <span className="text-gray-100 font-semibold">{type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2 tracking-tight">
                Station Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-[#ed6802] placeholder:text-gray-500 focus:outline-none focus:border-[#ed6802] focus:ring-2 focus:ring-[#ed6802]/20 transition-all"
                placeholder="e.g., PC-01"
                style={{ textIndent: "0.3em" }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2 tracking-tight">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-[#ed6802] placeholder:text-gray-500 focus:outline-none focus:border-[#ed6802] focus:ring-2 focus:ring-[#ed6802]/20 transition-all"
                placeholder="e.g., Floor 1, Row A"
                style={{ textIndent: "0.3em" }}
              />
            </div>
          </div>

          {/* Network Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2 tracking-tight">
                IP Address
              </label>
              <input
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-[#ed6802] placeholder:text-gray-500 focus:outline-none focus:border-[#ed6802] focus:ring-2 focus:ring-[#ed6802]/20 transition-all"
                placeholder="192.168.1.100"
                style={{ textIndent: "0.3em" }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2 tracking-tight">
                MAC Address
              </label>
              <input
                type="text"
                value={formData.mac_address}
                onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-[#ed6802] placeholder:text-gray-500 focus:outline-none focus:border-[#ed6802] focus:ring-2 focus:ring-[#ed6802]/20 transition-all"
                placeholder="00:00:00:00:00:00"
                style={{ textIndent: "0.3em" }}
              />
            </div>
          </div>

          {/* Specs (for PC only) */}
          {formData.station_type === 'PC' && (
            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-3 tracking-tight">
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
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-[#ed6802] placeholder:text-gray-500 focus:outline-none focus:border-[#ed6802] focus:ring-2 focus:ring-[#ed6802]/20 transition-all"
                    placeholder="CPU"
                    style={{ textIndent: "0.5em" }}
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
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-[#ed6802] placeholder:text-gray-500 focus:outline-none focus:border-[#ed6802] focus:ring-2 focus:ring-[#ed6802]/20 transition-all"
                    placeholder="GPU"
                    style={{ textIndent: "0.5em" }}
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
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-[#ed6802] placeholder:text-gray-500 focus:outline-none focus:border-[#ed6802] focus:ring-2 focus:ring-[#ed6802]/20 transition-all"
                    placeholder="RAM (GB)"
                    style={{ textIndent: "0.5em" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-neutral-700/30 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-neutral-800/70 hover:bg-neutral-700 text-gray-200 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border border-neutral-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#ed6802] to-[#ff7a1a] hover:from-[#ff7a1a] hover:to-[#ff8c3a] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#ed6802]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Creating...' : 'Create Station'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
