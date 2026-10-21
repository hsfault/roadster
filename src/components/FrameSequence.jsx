import { useEffect, useRef, useState } from 'react'
import { useMotionValueEvent } from 'motion/react'
import { SEQUENCES, PORTRAIT_QUERY, getOrientation } from '../lib/media'
import { loadSequence, onSequenceProgress } from '../lib/frames'

const toIndex = (v, count) => Math.min(count - 1, Math.max(0, Math.round(v * (count - 1))))

function pickFrame(entry, index) {
  if (entry.images[index]) return entry.images[index]
  for (let k = index - 1; k >= 0; k--) if (entry.images[k]) return entry.images[k]
  for (let k = index + 1; k < entry.count; k++) if (entry.images[k]) return entry.images[k]
  return null
}

// Draws the current frame with "object-fit: cover" behaviour
function drawFrame(canvas, s) {
  if (!canvas || !s.entry || !canvas.width) return
  const img = pickFrame(s.entry, s.index)
  if (!img) return

  const ctx = canvas.getContext('2d', { alpha: false })
  const cw = canvas.width
  const ch = canvas.height
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  const scale = Math.max(cw / iw, ch / ih)
  const w = iw * scale
  const h = ih * scale

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, (cw - w) * s.fx, (ch - h) * s.fy, w, h)
  s.exact = img === s.entry.images[s.index]
}

function scheduleDraw(canvas, s) {
  cancelAnimationFrame(s.raf)
  s.raf = requestAnimationFrame(() => drawFrame(canvas, s))
}

/**
 * Scroll-scrubbed image sequence drawn on a canvas.
 * progress = a Motion value from 0 to 1.
 * eager = load immediately (hero). Otherwise loads when ~1.5 screens away.
 */
export default function FrameSequence({
  name,
  progress,
  eager = false,
  focusX = 0.5,
  focusY = 0.5,
  className = '',
}) {
  const canvasRef = useRef(null)
  const stateRef = useRef({ entry: null, index: 0, raf: 0, exact: false, fx: 0.5, fy: 0.5 })
  const [orientation, setOrientation] = useState(getOrientation)
  const [near, setNear] = useState(eager)

  // Focus point (which part of the frame stays visible when cropped)
  useEffect(() => {
    const s = stateRef.current
    s.fx = focusX
    s.fy = focusY
    scheduleDraw(canvasRef.current, s)
  }, [focusX, focusY])

  // Switch sequence when the phone rotates
  useEffect(() => {
    const mq = window.matchMedia(PORTRAIT_QUERY)
    const onChange = () => setOrientation(mq.matches ? 'portrait' : 'landscape')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Lazy-load: start loading when the section is ~1.5 screens away
  useEffect(() => {
    if (near) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '150% 0px 150% 0px' }
    )
    io.observe(canvasRef.current)
    return () => io.disconnect()
  }, [near])

  // Load frames and redraw as they arrive
  useEffect(() => {
    if (!near) return
    const canvas = canvasRef.current
    const s = stateRef.current
    const entry = loadSequence(SEQUENCES[name][orientation])

    s.entry = entry
    s.index = toIndex(progress.get(), entry.count)
    s.exact = false
    scheduleDraw(canvas, s)

    const off = onSequenceProgress(entry, () => {
      if (!s.exact) scheduleDraw(canvas, s)
    })
    return () => {
      off()
      cancelAnimationFrame(s.raf)
    }
  }, [name, orientation, near, progress])

  // Keep canvas pixel size in sync with its box (DPR capped for speed)
  useEffect(() => {
    const canvas = canvasRef.current
    const s = stateRef.current
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        drawFrame(canvas, s)
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    return () => ro.disconnect()
  }, [])

  // Scroll → frame index (only redraw when the frame actually changes)
  useMotionValueEvent(progress, 'change', (v) => {
    const s = stateRef.current
    if (!s.entry) return
    const i = toIndex(v, s.entry.count)
    if (i !== s.index) {
      s.index = i
      s.exact = false
      scheduleDraw(canvasRef.current, s)
    }
  })

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full bg-void ${className}`}
    />
  )
}