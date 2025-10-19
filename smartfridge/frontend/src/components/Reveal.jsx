import { useEffect, useRef, useState } from 'react'

export default function Reveal({ children, className = '', once = true, threshold = 0.15 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisible(true)
          if (once) io.unobserve(el)
        } else if (!once) {
          setVisible(false)
        }
      })
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [once, threshold])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 will-change-[opacity,transform] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${className}`}
    >
      {children}
    </div>
  )
}

