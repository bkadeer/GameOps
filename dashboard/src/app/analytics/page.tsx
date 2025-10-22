'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'
import Analytics from '@/components/Analytics'
import { Loader2 } from 'lucide-react'

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useStore()

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [user, router])

  // Show loading while checking auth
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-[#ed6802] animate-spin" />
          <div className="absolute inset-0 animate-ping">
            <Loader2 className="w-12 h-12 text-[#ed6802] opacity-20" />
          </div>
        </div>
      </div>
    )
  }

  // Show access denied for non-admin users
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-gray-400">Analytics is only available for admin users.</p>
        </div>
      </div>
    )
  }

  return <Analytics />
}
