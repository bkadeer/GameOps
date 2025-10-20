'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Dashboard from '@/components/Dashboard'
import { useStore } from '@/store/useStore'
import { authAPI } from '@/lib/api'

export default function Home() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const { setUser, clearUser } = useStore()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const userData = await authAPI.getCurrentUser()
        setUser(userData)
        setIsChecking(false)
      } catch (error) {
        console.error('Failed to fetch current user:', error)
        clearUser()
        localStorage.removeItem('access_token')
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, setUser, clearUser])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ed6802]"></div>
      </div>
    )
  }

  return <Dashboard />
}
