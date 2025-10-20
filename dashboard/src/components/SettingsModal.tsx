'use client'

import { useState, useEffect } from 'react'
import { X, Key, Trash2, UserPlus, Shield, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'
import type { User } from '@/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User | null
}

export default function SettingsModal({ isOpen, onClose, currentUser }: SettingsModalProps) {
  const isAdmin = currentUser?.role === 'ADMIN'
  const [activeTab, setActiveTab] = useState<'profile' | 'manage'>('profile')
  
  // Debug: Log user role
  useEffect(() => {
    if (currentUser) {
      console.log('SettingsModal - Current User:', currentUser.username, 'Role:', currentUser.role, 'isAdmin:', isAdmin)
    }
  }, [currentUser, isAdmin])
  
  // Force profile tab for non-admin users
  useEffect(() => {
    if (!isAdmin && activeTab === 'manage') {
      setActiveTab('profile')
    }
  }, [isAdmin, activeTab])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  
  // Form state for creating user
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'STAFF' as 'ADMIN' | 'STAFF'
  })

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'manage' && isAdmin) {
        loadUsers()
      }
    }
  }, [isOpen, activeTab, isAdmin])

  const loadUsers = async () => {
    try {
      const data = await authAPI.listUsers()
      console.log('Loaded users:', data)
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password
    const password = formData.password
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain at least one uppercase letter')
      return
    }
    if (!/[a-z]/.test(password)) {
      toast.error('Password must contain at least one lowercase letter')
      return
    }
    if (!/\d/.test(password)) {
      toast.error('Password must contain at least one number')
      return
    }
    
    setLoading(true)

    try {
      // Only include email if it's not empty
      const userData: any = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        full_name: ''
      }
      
      // Only add email if it's provided
      if (formData.email && formData.email.trim() !== '') {
        userData.email = formData.email
      }
      
      await authAPI.createUser(userData)
      toast.success(`User "${formData.username}" created successfully`)
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        email: '',
        role: 'STAFF'
      })
      
      loadUsers()
    } catch (error: any) {
      console.error('Failed to create user:', error)
      
      // Handle validation errors
      if (error.response?.status === 422 && error.response?.data?.detail) {
        const details = error.response.data.detail
        if (Array.isArray(details)) {
          const messages = details.map((err: any) => {
            if (err.msg) return err.msg
            if (err.type === 'value_error') return err.ctx?.error || 'Validation error'
            return 'Invalid input'
          }).join(', ')
          toast.error(messages)
        } else {
          toast.error(details)
        }
      } else {
        toast.error(error.response?.data?.detail || 'Failed to create user')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return
    
    // Validate password
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter')
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error('Password must contain at least one lowercase letter')
      return
    }
    if (!/\d/.test(newPassword)) {
      toast.error('Password must contain at least one number')
      return
    }
    
    setLoading(true)
    try {
      console.log('Resetting password for user:', selectedUser.id, 'Username:', selectedUser.username)
      await authAPI.resetPassword(selectedUser.id, newPassword)
      const isOwnPassword = selectedUser.id === currentUser?.id
      toast.success(isOwnPassword ? 'Your password has been reset successfully' : `Password reset for "${selectedUser.username}"`)
      setShowPasswordReset(false)
      setSelectedUser(null)
      setNewPassword('')
    } catch (error: any) {
      console.error('Failed to reset password:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to reset password'
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('Cannot disable your own account')
      return
    }
    
    const action = user.is_active ? 'disable' : 'enable'
    if (!confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
      return
    }
    
    setLoading(true)
    try {
      await authAPI.toggleUserStatus(user.id)
      toast.success(`User "${user.username}" ${action}d successfully`)
      loadUsers()
    } catch (error: any) {
      console.error('Failed to toggle user:', error)
      toast.error(error.response?.data?.detail || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700/50 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-700/50">
            <div>
              <h2 className="text-xl font-semibold text-[#E5E5E5]">Settings</h2>
              <p className="text-sm text-[#A0A0A0] mt-1">Manage your profile and users</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#A0A0A0]" />
            </button>
          </div>

          {/* Tabs - Only show Manage Users for ADMIN */}
          <div className="flex border-b border-neutral-700/50 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-5 py-4 font-medium transition-all relative ${
                activeTab === 'profile'
                  ? 'text-[#ed6802]'
                  : 'text-[#A0A0A0] hover:text-[#E5E5E5]'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                My Profile
              </div>
              {activeTab === 'profile' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ed6802]" />
              )}
            </button>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-5 py-4 font-medium transition-all relative ${
                  activeTab === 'manage'
                    ? 'text-[#ed6802]'
                    : 'text-[#A0A0A0] hover:text-[#E5E5E5]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Manage Users
                </div>
                {activeTab === 'manage' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ed6802]" />
                )}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* My Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Profile Info */}
                <div>
                  <h3 className="text-base font-semibold text-[#E5E5E5] mb-4">Profile Information</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-[#A0A0A0] block mb-3">Username</label>
                      <div className="px-4 py-3 bg-[#252525] border border-[#333333] rounded-lg text-[#E5E5E5]">
                        {currentUser?.username}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#A0A0A0] block mb-3">Role</label>
                      <div className="px-4 py-3 bg-[#252525] border border-[#333333] rounded-lg">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          currentUser?.role === 'ADMIN' 
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {currentUser?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div>
                  <h3 className="text-base font-semibold text-[#E5E5E5] mb-3">Change Password</h3>
                  <p className="text-sm text-[#A0A0A0] mb-5">Update your password to keep your account secure.</p>
                  <button
                    onClick={() => {
                      console.log('Current user for password reset (My Profile):', currentUser)
                      setSelectedUser(currentUser)
                      setShowPasswordReset(true)
                    }}
                    className="w-full px-5 py-3 bg-gradient-to-r from-[#ed6802] to-[#ff7a1a] hover:from-[#ff7a1a] hover:to-[#ff8c3a] text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Reset My Password
                  </button>
                </div>
              </div>
            )}

            {/* Manage Users Tab */}
            {activeTab === 'manage' && isAdmin && (
              <div className="space-y-8">
                {/* Add User Form */}
                <div>
                  <h3 className="text-base font-semibold text-[#E5E5E5] mb-4">Add New User</h3>
                  <form onSubmit={handleCreateUser} className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-[#A0A0A0] block mb-3">
                        Username / Account Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-4 py-3 bg-[#252525] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors placeholder:text-[#666666]"
                        placeholder="Enter username"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#A0A0A0] block mb-3">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-[#252525] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors placeholder:text-[#666666]"
                        placeholder="user@example.com"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#A0A0A0] block mb-3">
                        Temporary Password
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 bg-[#252525] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors placeholder:text-[#666666]"
                        placeholder="e.g., TempPass123"
                        minLength={8}
                      />
                      <div className="mt-2 ml-1">
                        <p className="text-xs text-[#A0A0A0] mb-1">Password must contain:</p>
                        <ul className="text-xs text-[#666666] ml-4 space-y-0.5">
                          <li>• At least 8 characters</li>
                          <li>• One uppercase letter (A-Z)</li>
                          <li>• One lowercase letter (a-z)</li>
                          <li>• One number (0-9)</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#A0A0A0] block mb-3">
                        User Type / Role
                      </label>
                      <select
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                        className="w-full px-4 py-3 bg-[#252525] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors cursor-pointer"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-5 py-3 bg-gradient-to-r from-[#ed6802] to-[#ff7a1a] hover:from-[#ff7a1a] hover:to-[#ff8c3a] text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      {loading ? 'Adding User...' : 'Add User'}
                    </button>
                  </form>
                </div>

                {/* User List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-[#E5E5E5]">User List</h3>
                    <span className="text-sm text-[#A0A0A0]">{users.length} users</span>
                  </div>
                  
                  <div className="border border-[#333333] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[#252525]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0A0A0] uppercase">
                            Username
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#A0A0A0] uppercase">
                            Role
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-[#A0A0A0] uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#333333]">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-[#A0A0A0]">
                              No users found
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr 
                              key={user.id}
                              className="hover:bg-[#252525] transition-colors"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#E5E5E5] font-medium">{user.username}</span>
                                  {!user.is_active && (
                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                                      DISABLED
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  user.role === 'ADMIN' 
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      console.log('Selected user for password reset:', user)
                                      setSelectedUser(user)
                                      setShowPasswordReset(true)
                                    }}
                                    className="px-3 py-1.5 bg-[#252525] hover:bg-[#2D2D2D] text-[#A0A0A0] hover:text-[#E5E5E5] rounded-lg transition-all flex items-center gap-1.5 text-sm border border-[#333333]"
                                    title="Reset Password"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                    Reset
                                  </button>
                                  <button
                                    onClick={() => handleToggleUser(user)}
                                    disabled={loading || user.id === currentUser?.id}
                                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm border disabled:opacity-50 disabled:cursor-not-allowed ${
                                      user.is_active
                                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30'
                                    }`}
                                    title={user.id === currentUser?.id ? 'Cannot disable your own account' : (user.is_active ? 'Disable User' : 'Enable User')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {user.is_active ? 'Disable' : 'Enable'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && selectedUser && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setShowPasswordReset(false)
            setSelectedUser(null)
            setNewPassword('')
          }}
        >
          <div 
            className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700/50 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-[#E5E5E5] mb-2">
                Reset Password
              </h3>
              <p className="text-sm text-[#A0A0A0] mb-6">
                {selectedUser.id === currentUser?.id 
                  ? 'Enter your new password below' 
                  : `Changing password for ${selectedUser.username}`
                }
              </p>
              
              <div className="mb-6">
                <label className="text-sm font-medium text-[#A0A0A0] block mb-3">
                  New Password
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#252525] border border-[#333333] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#ed6802] transition-colors placeholder:text-[#666666]"
                  placeholder="e.g., NewPass123!"
                  minLength={8}
                  autoFocus
                />
                <div className="mt-2 ml-1">
                  <p className="text-xs text-[#A0A0A0] mb-1">Password must contain:</p>
                  <ul className="text-xs text-[#666666] ml-4 space-y-0.5">
                    <li>• At least 8 characters</li>
                    <li>• One uppercase letter (A-Z)</li>
                    <li>• One lowercase letter (a-z)</li>
                    <li>• One number (0-9)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordReset(false)
                    setSelectedUser(null)
                    setNewPassword('')
                  }}
                  className="flex-1 px-4 py-3 bg-[#252525] hover:bg-[#2D2D2D] text-[#E5E5E5] rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={loading || !newPassword || newPassword.length < 8}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#ed6802] to-[#ff7a1a] hover:from-[#ff7a1a] hover:to-[#ff8c3a] text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
