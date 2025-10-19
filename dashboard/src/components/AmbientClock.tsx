'use client'

import { useEffect, useState } from 'react'

export default function AmbientClock() {
  const [time, setTime] = useState('')
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      
      // Convert to CST (UTC-6)
      const cstTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }))
      
      const hours = String(cstTime.getHours()).padStart(2, '0')
      const minutes = String(cstTime.getMinutes()).padStart(2, '0')
      const seconds = String(cstTime.getSeconds()).padStart(2, '0')
      
      setTime(`${hours}:${minutes}:${seconds}`)
    }

    // Update immediately
    updateTime()
    
    // Update every second
    const interval = setInterval(updateTime, 1000)
    
    // Blink colon every second
    const blinkInterval = setInterval(() => {
      setBlink(prev => !prev)
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(blinkInterval)
    }
  }, [])

  return (
    <div className="relative select-none">
      <div className="relative">
        {/* Subtle glow effect */}
        <div className="absolute -inset-1 blur-lg opacity-10 bg-gradient-to-r from-orange-300/20 to-orange-200/10 rounded-xl animate-pulse" style={{ animationDuration: '4s', zIndex: -1 }}></div>
        
        {/* Clock display - minimal and translucent */}
        <div className="relative px-4 py-2 rounded-xl bg-black/10 backdrop-blur-md border border-white/5">
          <div className="flex items-center gap-0.5">
            <span 
              className="font-mono text-sm tracking-wider text-white/40 transition-all duration-500"
              style={{
                fontFamily: "'Roboto Mono', monospace",
                fontWeight: 300,
                letterSpacing: '0.15em',
                textShadow: '0 0 15px rgba(255, 255, 255, 0.1), 0 0 30px rgba(237, 104, 2, 0.05)'
              }}
            >
              {time.split(':').map((part, index) => (
                <span key={index}>
                  {part}
                  {index < 2 && (
                    <span 
                      className={`inline-block transition-opacity duration-300 ${
                        blink ? 'opacity-100' : 'opacity-30'
                      }`}
                      style={{
                        textShadow: blink 
                          ? '0 0 10px rgba(237, 104, 2, 0.2), 0 0 20px rgba(237, 104, 2, 0.1)' 
                          : '0 0 5px rgba(237, 104, 2, 0.05)'
                      }}
                    >
                      :
                    </span>
                  )}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
