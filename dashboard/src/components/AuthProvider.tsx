'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import api from '@/lib/api'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      
      if (token) {
        try {
          // Fetch current user with the stored token
          const response = await api.get('/auth/me')
          setUser(response.data)
        } catch (error) {
          // Token is invalid or expired, clear it
          localStorage.removeItem('access_token')
          setUser(null)
        }
      }
      
      setIsLoading(false)
    }

    initAuth()
  }, [setUser])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ed6802]"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ed6802] opacity-20"></div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
