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
  const presetDurations = [16, 60, 120, 180, 300]
  
  // Pricing: 1H $8, 2H $14, 3H $21, 4H $28, 5H $32
  const calculateAmount = (minutes: number) => {
    // Test duration - free
    if (minutes < 60) return 0
    
    const hours = minutes / 60
    if (hours <= 1) return 8
    if (hours <= 2) return 14
    if (hours <= 3) return 21
    if (hours <= 4) return 28
    if (hours <= 5) return 32
    // For more than 5 hours, use $6.40 per hour rate
    return Math.round(hours * 6.4)
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
    const amount = formData.payment_method === 'ONLINE' ? 0 : calculateAmount(minutes)
    setFormData({
      ...formData,
      duration_minutes: minutes,
      amount: amount
    })
  }

  const handlePaymentMethodChange = (method: string) => {
    const amount = method === 'ONLINE' ? 0 : calculateAmount(formData.duration_minutes)
    setFormData({
      ...formData,
      payment_method: method,
      amount: amount
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

    if (formData.payment_method !== 'ONLINE' && formData.amount <= 0) {
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
      
      // Close modal and refresh immediately
      onClose()
      onSuccess()
      
      // Show success toast after modal closes
      toast.success(`Session started on ${station.name} for ${formData.duration_minutes} minutes!`, {
        duration: 2000
      })
      // Reset form
      setFormData({
        duration_minutes: 60,
        payment_method: 'CASH',
        amount: calculateAmount(60),
        notes: ''
      })
    } catch (err: any) {
      console.error('Session creation error:', err)
      
      let errorMsg = 'Failed to start session'
      
      // Handle different error response formats
      if (err.response?.data?.detail) {
        // Check if detail is an array (validation errors)
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((e: any) => e.msg || e.message).join(', ')
        } else if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail
        } else {
          errorMsg = JSON.stringify(err.response.data.detail)
        }
      } else if (err.message) {
        errorMsg = err.message
      }
      
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !station) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700/50 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700/50">
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
            <div className="grid grid-cols-5 gap-3">
              {presetDurations.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => handleDurationChange(minutes)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.duration_minutes === minutes
                      ? 'border-[#ed6802] bg-[#ed6802]/10 scale-105'
                      : 'border-neutral-700/40 bg-neutral-800/60 hover:border-neutral-600/60 hover:scale-105'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-gray-100 font-bold text-lg">
                      {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                    </div>
                    <div className={`text-sm font-semibold mt-1.5 ${
                      minutes < 60 ? 'text-cyan-400' : 'text-[#ed6802]'
                    }`}>
                      {minutes < 60 ? '🧪 TEST' : `$${calculateAmount(minutes)}`}
                    </div>
                  </div>
                </button>
              ))}
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
                { value: 'ONLINE', label: 'Free', icon: DollarSign }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePaymentMethodChange(value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.payment_method === value
                      ? 'border-[#ed6802] bg-[#ed6802]/10 scale-105'
                      : 'border-neutral-700/40 bg-neutral-800/60 hover:border-neutral-600/60 hover:scale-105'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    value === 'ONLINE' ? 'text-emerald-400' : 'text-gray-400'
                  }`} />
                  <div className="text-sm text-gray-100 font-semibold">{label}</div>
                </button>
              ))}
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
              className="w-full px-4 py-2.5 bg-neutral-800/60 border border-neutral-700/40 rounded-xl text-gray-100 focus:outline-none focus:border-[#ed6802] transition-colors resize-none"
              placeholder="Add any notes..."
            />
          </div>

          {/* Summary */}
          <div className="bg-neutral-800/40 rounded-xl p-5 border border-neutral-700/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Duration</span>
              <span className="text-gray-100 font-semibold">{formData.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Payment</span>
              <span className="text-gray-100 font-semibold">{formData.payment_method === 'ONLINE' ? 'Free' : formData.payment_method}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-neutral-700/40">
              <span className="text-gray-100 font-bold text-lg">Total</span>
              <span className={`font-bold text-xl ${
                formData.payment_method === 'ONLINE' ? 'text-emerald-400' : 'text-[#ed6802]'
              }`}>
                {formData.payment_method === 'ONLINE' ? 'FREE' : `$${formData.amount.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-neutral-800/60 hover:bg-neutral-700/60 text-gray-100 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#ed6802] to-[#ff7a1a] hover:from-[#ff7a1a] hover:to-[#ff8c3a] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#ed6802]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
