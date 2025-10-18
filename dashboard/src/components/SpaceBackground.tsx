'use client'

import { useEffect, useRef } from 'react'

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)

    // Star particles
    interface Star {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      twinkleSpeed: number
      twinklePhase: number
    }

    const stars: Star[] = []
    const starCount = 250

    // Create stars
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random(),
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        twinklePhase: Math.random() * Math.PI * 2,
      })
    }

    // Nebula clouds
    interface Cloud {
      x: number
      y: number
      radius: number
      speedX: number
      speedY: number
      hue: number
    }

    const clouds: Cloud[] = []
    const cloudCount = 8

    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 100 + Math.random() * 200,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        hue: 200 + Math.random() * 60, // Blue to purple range
      })
    }


    // Animation loop
    let animationId: number
    const animate = () => {
      // Create deep space gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#0a0a0f')
      gradient.addColorStop(0.5, '#1a1a2e')
      gradient.addColorStop(1, '#16213e')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw nebula clouds
      clouds.forEach((cloud) => {
        const gradient = ctx.createRadialGradient(
          cloud.x,
          cloud.y,
          0,
          cloud.x,
          cloud.y,
          cloud.radius
        )
        gradient.addColorStop(0, `hsla(${cloud.hue}, 70%, 50%, 0.08)`)
        gradient.addColorStop(0.5, `hsla(${cloud.hue}, 60%, 40%, 0.03)`)
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.fillRect(
          cloud.x - cloud.radius,
          cloud.y - cloud.radius,
          cloud.radius * 2,
          cloud.radius * 2
        )

        // Move clouds
        cloud.x += cloud.speedX
        cloud.y += cloud.speedY

        // Wrap around
        if (cloud.x < -cloud.radius) cloud.x = canvas.width + cloud.radius
        if (cloud.x > canvas.width + cloud.radius) cloud.x = -cloud.radius
        if (cloud.y < -cloud.radius) cloud.y = canvas.height + cloud.radius
        if (cloud.y > canvas.height + cloud.radius) cloud.y = -cloud.radius
      })

      // Draw stars
      stars.forEach((star) => {
        // Twinkling effect
        star.twinklePhase += star.twinkleSpeed
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2
        const opacity = star.opacity * twinkle

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()

        // Add glow for larger stars
        if (star.size > 1.5) {
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3})`
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2)
          ctx.fill()
        }

        // Move stars
        star.x += star.speedX
        star.y += star.speedY

        // Wrap around
        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0
      })

      // Add some orange accent stars
      const orangeStars = stars.filter((_, i) => i % 20 === 0)
      orangeStars.forEach((star) => {
        const twinkle = (Math.sin(star.twinklePhase) + 1) / 2
        ctx.fillStyle = `rgba(217, 122, 50, ${twinkle * 0.4})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2)
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', setCanvasSize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: '#0a0a0f' }}
    />
  )
}
