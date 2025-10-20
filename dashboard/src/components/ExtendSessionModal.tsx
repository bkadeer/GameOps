'use client'

import { useState } from 'react'
import { X, DollarSign, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { sessionsAPI } from '@/lib/api'
import type { Session } from '@/types'

interface ExtendSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  session: Session | null
}

export default function ExtendSessionModal({ isOpen, onClose, onSuccess, session }: ExtendSessionModalProps) {
  const [loading, setLoading] = useState(false)
  const [extendMinutes, setExtendMinutes] = useState(30)
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  // Pricing calculation for extension
  const calculateExtensionAmount = (minutes: number) => {
    if (minutes === 30) return 5
    const hours = minutes / 60
    if (hours <= 1) return 8
    if (hours <= 2) return 14
    if (hours <= 3) return 21
    return Math.round(hours * 6.4)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setLoading(true)
    try {
      const amount = paymentMethod === 'ONLINE' ? 0 : calculateExtensionAmount(extendMinutes)
      await sessionsAPI.extend(session.id, extendMinutes, paymentMethod, amount)
      toast.success(`Session extended by ${extendMinutes} minutes`)
      setExtendMinutes(30)
      setPaymentMethod('CASH')
      onSuccess()
    } catch (error) {
      console.error('Failed to extend session:', error)
      toast.error('Failed to extend session')
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
          <h2 className="text-xl font-bold text-gray-100">Extend Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Station</p>
              <p className="text-gray-100 font-semibold">{session.station_name || session.station?.name || `Station ${session.station_id.slice(0, 8)}`}</p>
            </div>

            <div>
              <label className="text-gray-100 text-sm font-medium block mb-3">Additional Time</label>
              <div className="grid grid-cols-4 gap-3">
                {[30, 60, 120, 180].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setExtendMinutes(minutes)}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                      extendMinutes === minutes
                        ? 'border-[#ed6802] bg-[#ed6802]/10 scale-105'
                        : 'border-neutral-700/40 bg-neutral-800/60 hover:border-neutral-600/60 hover:scale-105'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-gray-100 font-bold">{minutes}m</div>
                      <div className="text-xs text-[#ed6802] font-semibold mt-1">${calculateExtensionAmount(minutes)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-100 text-sm font-medium block mb-3">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'CASH', label: 'Cash', icon: DollarSign },
                  { value: 'CARD', label: 'Card', icon: CreditCard },
                  { value: 'ONLINE', label: 'Free', icon: DollarSign }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                      paymentMethod === value
                        ? 'border-[#ed6802] bg-[#ed6802]/10 scale-105'
                        : 'border-neutral-700/40 bg-neutral-800/60 hover:border-neutral-600/60 hover:scale-105'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${
                      value === 'ONLINE' ? 'text-emerald-400' : 'text-gray-400'
                    }`} />
                    <div className="text-xs text-gray-100 font-semibold">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-neutral-800/40 rounded-xl p-4 border border-neutral-700/40">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Total</span>
                <span className={`font-bold text-lg ${
                  paymentMethod === 'ONLINE' ? 'text-emerald-400' : 'text-[#ed6802]'
                }`}>
                  {paymentMethod === 'ONLINE' ? 'FREE' : `$${calculateExtensionAmount(extendMinutes).toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-neutral-800/60 hover:bg-neutral-700/60 text-gray-100 rounded-xl font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#ed6802] to-[#ff7a1a] hover:from-[#ff7a1a] hover:to-[#ff8c3a] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#ed6802]/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Extending...' : `Extend ${extendMinutes}m`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
