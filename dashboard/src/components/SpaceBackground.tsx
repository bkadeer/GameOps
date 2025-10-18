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

    // Light rays (random directions across screen)
    interface LightRay {
      x: number
      y: number
      length: number
      angle: number
      opacity: number
      speed: number
    }

    const lightRays: LightRay[] = []
    for (let i = 0; i < 8; i++) {
      lightRays.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: 150 + Math.random() * 400,
        angle: Math.random() * Math.PI * 2, // Full 360 degrees
        opacity: Math.random() * 0.12 + 0.03,
        speed: 0.0003 + Math.random() * 0.0008,
      })
    }

    // Parallax offset
    let parallaxX = 0
    let parallaxY = 0


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

      // Update parallax based on mouse position (subtle drift)
      parallaxX += (Math.sin(Date.now() * 0.0001) * 0.5)
      parallaxY += (Math.cos(Date.now() * 0.00015) * 0.3)

      // Draw light rays (random directions)
      lightRays.forEach((ray) => {
        ray.opacity = Math.sin(Date.now() * ray.speed) * 0.08 + 0.06
        
        ctx.save()
        ctx.translate(ray.x + parallaxX * 1.5, ray.y + parallaxY * 1.5)
        ctx.rotate(ray.angle)
        
        const rayGradient = ctx.createLinearGradient(0, 0, ray.length, 0)
        rayGradient.addColorStop(0, `rgba(255, 255, 255, ${ray.opacity})`)
        rayGradient.addColorStop(0.4, `rgba(217, 122, 50, ${ray.opacity * 0.4})`)
        rayGradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = rayGradient
        ctx.fillRect(0, -0.5, ray.length, 1)
        ctx.restore()
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
