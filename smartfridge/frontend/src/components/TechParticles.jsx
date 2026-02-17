import { useEffect, useRef } from 'react'

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function TechParticles({ enabled = true, className = '' }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!enabled || prefersReducedMotion()) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = {
      w: 0,
      h: 0,
      dpr: 1,
      particles: [],
      t: 0,
    }

    const setSize = () => {
      state.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      state.w = window.innerWidth
      state.h = window.innerHeight
      canvas.width = Math.floor(state.w * state.dpr)
      canvas.height = Math.floor(state.h * state.dpr)
      canvas.style.width = `${state.w}px`
      canvas.style.height = `${state.h}px`
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)
    }

    const rand = (min, max) => min + Math.random() * (max - min)

    const initParticles = () => {
      const area = Math.max(1, state.w * state.h)
      const count = Math.max(32, Math.min(72, Math.round(area / 42000)))
      state.particles = Array.from({ length: count }).map(() => ({
        x: rand(0, state.w),
        y: rand(0, state.h),
        vx: rand(-0.18, 0.18),
        vy: rand(-0.12, 0.12),
        r: rand(0.8, 1.6),
      }))
    }

    setSize()
    initParticles()

    const onResize = () => {
      setSize()
      initParticles()
    }
    window.addEventListener('resize', onResize)

    const draw = () => {
      state.t += 1
      ctx.clearRect(0, 0, state.w, state.h)

      // soft vignette
      const g = ctx.createRadialGradient(state.w * 0.5, state.h * 0.35, 0, state.w * 0.5, state.h * 0.35, Math.max(state.w, state.h) * 0.7)
      g.addColorStop(0, 'rgba(99,102,241,0.08)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, state.w, state.h)

      const linkDist = Math.max(110, Math.min(160, Math.min(state.w, state.h) / 7))

      // links
      for (let i = 0; i < state.particles.length; i++) {
        const a = state.particles[i]
        for (let j = i + 1; j < state.particles.length; j++) {
          const b = state.particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 > linkDist * linkDist) continue
          const d = Math.sqrt(d2)
          const alpha = Math.max(0, 1 - d / linkDist) * 0.18
          ctx.strokeStyle = `rgba(148,163,184,${alpha})` // slate-400
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      // particles
      for (const p of state.particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -20) p.x = state.w + 20
        if (p.x > state.w + 20) p.x = -20
        if (p.y < -20) p.y = state.h + 20
        if (p.y > state.h + 20) p.y = -20

        ctx.fillStyle = 'rgba(165,180,252,0.35)' // indigo-200
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = window.requestAnimationFrame(draw)
    }

    rafRef.current = window.requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', onResize)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [enabled])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 opacity-70 ${className}`}
      aria-hidden="true"
    />
  )
}

