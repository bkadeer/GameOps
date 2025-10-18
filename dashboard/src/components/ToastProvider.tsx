'use client'

import { Toaster } from 'react-hot-toast'

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#252525',
          color: '#E5E5E5',
          border: '1px solid #333333',
          borderRadius: '12px',
          padding: '16px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#252525',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#252525',
          },
        },
      }}
    />
  )
}
