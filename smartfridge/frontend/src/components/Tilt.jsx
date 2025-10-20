import { useEffect, useRef, useState } from 'react'
import useUI from '../lib/ui.js'

export default function Tilt({
  children,
  className = '',
  maxTilt = 22,
  maxTranslate = 12,
  maxRotateZ = 10,
  maxTranslateZ = 10,
  scale = 1.04,
  expand = 120, // px: extend detection area beyond the element on all sides
  as: Tag = 'span',
}) {
  const ref = useRef(null)
  const [style, setStyle] = useState({})
  const { animEnabled } = useUI()
  const trackingRef = useRef(false)

  const applyFromPoint = (x, y) => {
    if (!animEnabled) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const left = rect.left - expand
    const top = rect.top - expand
    const width = rect.width + expand * 2
    const height = rect.height + expand * 2
    const px = (x - left) / width // 0..1 (extended)
    const py = (y - top) / height // 0..1 (extended)
    if (px < 0 || px > 1 || py < 0 || py > 1) {
      // outside extended zone -> gracefully reset and stop tracking
      reset()
      stopTracking()
      return
    }
    const rx = (py - 0.5) * -2 * maxTilt // rotateX
    const ry = (px - 0.5) * 2 * maxTilt // rotateY
    const rz = (px - 0.5) * 2 * maxRotateZ // rotateZ
    const tx = (px - 0.5) * maxTranslate // translateX px
    const ty = (py - 0.5) * maxTranslate // translateY px
    const dist = Math.hypot(px - 0.5, py - 0.5)
    const tz = (1 - Math.min(dist * 2, 1)) * maxTranslateZ // pop out near center
    setStyle({
      transform: `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, ${tz.toFixed(1)}px) scale(${scale})`,
      transition: 'transform 60ms ease-out',
      willChange: 'transform',
      transformStyle: 'preserve-3d',
      display: 'inline-block',
    })
  }

  const onMove = (e) => {
    applyFromPoint(e.clientX, e.clientY)
  }

  const reset = () => {
    if (!animEnabled) return
    setStyle({
      transform: 'perspective(700px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) translate3d(0,0,0) scale(1)',
      transition: 'transform 200ms ease',
      display: 'inline-block',
    })
  }

  const stopTracking = () => {
    if (!trackingRef.current) return
    window.removeEventListener('mousemove', onWindowMove)
    trackingRef.current = false
  }

  const onWindowMove = (e) => applyFromPoint(e.clientX, e.clientY)

  const onEnter = () => {
    if (!animEnabled) return
    if (!trackingRef.current) {
      window.addEventListener('mousemove', onWindowMove)
      trackingRef.current = true
    }
  }

  useEffect(() => () => stopTracking(), [])

  return (
    <Tag
      ref={ref}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      className={className}
      style={style}
    >
      {children}
    </Tag>
  )
}
