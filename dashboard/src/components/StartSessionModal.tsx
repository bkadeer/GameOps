'use client'

import { useState } from 'react'
import { X, Clock, DollarSign, CreditCard, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { sessionsAPI } from '@/lib/api'
import type { Station } from '@/types'

interface StartSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  station: Station | null
}

export default function StartSessionModal({ isOpen, onClose, onSuccess, station }: StartSessionModalProps) {
  const presetDurations = [30, 60, 120, 180, 240]
  const hourlyRate = 5 // $5 per hour

  const calculateAmount = (minutes: number) => {
    return (minutes / 60) * hourlyRate
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    duration_minutes: 60,
    payment_method: 'CASH',
    amount: calculateAmount(60), // Initialize with calculated amount
    notes: ''
  })

  const handleDurationChange = (minutes: number) => {
    setFormData({
      ...formData,
      duration_minutes: minutes,
      amount: calculateAmount(minutes)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!station) return

    setError('')

    // Validation
    if (formData.duration_minutes < 15) {
      toast.error('Minimum duration is 15 minutes')
      return
    }

    if (formData.amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    setLoading(true)

    try {
      await sessionsAPI.create({
        station_id: station.id,
        duration_minutes: formData.duration_minutes,
        payment_method: formData.payment_method,
        amount: formData.amount,
        notes: formData.notes || undefined
      })
      toast.success(`Session started on ${station.name} for ${formData.duration_minutes} minutes!`)
      onSuccess()
      onClose()
      // Reset form
      setFormData({
        duration_minutes: 60,
        payment_method: 'CASH',
        amount: calculateAmount(60),
        notes: ''
      })
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to start session'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !station) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#252525] rounded-2xl border border-[#333333] max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333333]">
          <div>
            <h2 className="text-xl font-semibold text-[#E5E5E5]">Start Session</h2>
            <p className="text-sm text-[#A0A0A0] mt-1">{station.name} - {station.location}</p>
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

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-[#E5E5E5] mb-3">
              <Clock className="w-4 h-4 inline mr-2" />
              Duration
            </label>
            <div className="grid grid-cols-5 gap-2">
              {presetDurations.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => handleDurationChange(minutes)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.duration_minutes === minutes
                      ? 'border-[#ed6802] bg-[#ed6802]/10'
                      : 'border-[#333333] bg-[#2D2D2D] hover:border-[#444444]'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-[#E5E5E5] font-semibold">{minutes / 60}h</div>
                    <div className="text-xs text-[#A0A0A0] mt-1">${calculateAmount(minutes)}</div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Custom Duration */}
            <div className="mt-3">
              <input
                type="number"
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 60)}
                className="w-full px-4 py-2.5 bg-[#2D2D2D] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors"
                placeholder="Custom duration (minutes)"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[#E5E5E5] mb-3">
              <CreditCard className="w-4 h-4 inline mr-2" />
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'CASH', label: 'Cash', icon: DollarSign },
                { value: 'CARD', label: 'Card', icon: CreditCard },
                { value: 'BALANCE', label: 'Balance', icon: Wallet }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.payment_method === value
                      ? 'border-[#ed6802] bg-[#ed6802]/10'
                      : 'border-[#333333] bg-[#2D2D2D] hover:border-[#444444]'
                  }`}
                >
                  <Icon className="w-5 h-5 text-[#A0A0A0] mx-auto mb-1" />
                  <div className="text-sm text-[#E5E5E5]">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[#E5E5E5] mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full pl-8 pr-4 py-2.5 bg-[#2D2D2D] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#E5E5E5] mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 bg-[#2D2D2D] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors resize-none"
              placeholder="Add any notes..."
            />
          </div>

          {/* Summary */}
          <div className="bg-[#2D2D2D] rounded-lg p-4 border border-[#333333]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#A0A0A0]">Duration</span>
              <span className="text-[#E5E5E5] font-semibold">{formData.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#A0A0A0]">Payment</span>
              <span className="text-[#E5E5E5] font-semibold">{formData.payment_method}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#333333]">
              <span className="text-[#E5E5E5] font-semibold">Total</span>
              <span className="text-[#ed6802] font-bold text-xl">${formData.amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
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
              {loading ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
