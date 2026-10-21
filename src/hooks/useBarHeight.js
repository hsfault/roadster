import { useEffect, useState } from 'react'

// Letterbox bar height: true 2.39:1 on landscape screens, fixed 56px on phones
function measure() {
  const w = window.innerWidth
  const h = window.innerHeight
  const portrait = h > w
  let bar = portrait ? 56 : (h - w / 2.39) / 2
  bar = Math.max(bar, portrait ? 56 : 48)
  bar = Math.round(Math.min(bar, h * 0.16))
  return { bar, vh: h }
}

export default function useBarHeight() {
  const [size, setSize] = useState(() =>
    typeof window === 'undefined' ? { bar: 56, vh: 800 } : measure()
  )

  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setSize((prev) => {
          const next = measure()
          return next.bar === prev.bar && next.vh === prev.vh ? prev : next
        })
      })
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return size
}