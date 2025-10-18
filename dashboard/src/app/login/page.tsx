'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gamepad2, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useStore } from '@/store/useStore'
import SpaceBackground from '@/components/SpaceBackground'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useStore((state) => state.setUser)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authAPI.login(username, password)
      localStorage.setItem('access_token', data.access_token)
      
      // Set user in store (you'll need to fetch user details)
      setUser({ 
        id: '1', 
        username, 
        email: '', 
        role: 'ADMIN',
        account_balance: 0,
        created_at: new Date().toISOString()
      })
      
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Space Background */}
      <SpaceBackground />
      
      {/* Login Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-[480px] animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D97A32] to-[#E5893B] rounded-[24px] blur-xl opacity-40"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-[#D97A32] to-[#E5893B] rounded-[24px] flex items-center justify-center shadow-2xl">
                <Gamepad2 className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-[rgba(18,18,18,0.95)] backdrop-blur-3xl rounded-[32px] shadow-2xl border border-[#2a2a2a]/80 px-14 py-16">
            <div className="text-center mb-14">
              <h1 className="text-[36px] font-bold text-[#FFFFFF] mb-4 tracking-tight leading-none">
                Welcome Back
              </h1>
              <p className="text-[#9CA3AF] text-[16px] font-light leading-relaxed">
                Sign in to access your dashboard!
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Username Field */}
              <div className="space-y-3">
                <label htmlFor="username" className="block text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Username or Email
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-6 py-4 bg-[rgba(10,10,10,0.6)] border-2 border-[#2a2a2a] rounded-2xl text-[16px] text-[#FFFFFF] placeholder-[#6B7280] focus:outline-none focus:border-[#D97A32] focus:bg-[rgba(10,10,10,0.8)] transition-all duration-300"
                  placeholder="your@email.com"
                  required
                  autoComplete="username"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Password
                  </label>
                  <a 
                    href="#" 
                    className="text-[13px] text-[#D97A32] hover:text-[#E5893B] transition-colors font-semibold"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-[rgba(10,10,10,0.6)] border-2 border-[#2a2a2a] rounded-2xl text-[16px] text-[#FFFFFF] placeholder-[#6B7280] focus:outline-none focus:border-[#D97A32] focus:bg-[rgba(10,10,10,0.8)] transition-all duration-300 pr-14"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 text-[#6B7280] hover:text-[#D97A32] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-10 py-4 bg-gradient-to-r from-[#D97A32] to-[#E5893B] hover:from-[#E5893B] hover:to-[#F09850] text-white text-[15px] font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-[#D97A32]/30 hover:shadow-xl hover:shadow-[#E5893B]/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 uppercase tracking-wider"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2a2a2a]"></div>
              </div>
            </div>

            {/* Footer Text */}
            <p className="text-center text-[14px] text-[#6B7280]">
              Need access?{' '}
              <a href="#" className="text-[#D97A32] hover:text-[#E5893B] transition-colors font-semibold">
                Contact your administrator
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
