import { useRef } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react'
import useBarHeight from '../hooks/useBarHeight'
import useActiveChapter from '../hooks/useActiveChapter'
import { FILM_SECONDS, FPS } from '../lib/chapters'

function toTimecode(p) {
  const total = Math.floor(Math.min(Math.max(p, 0), 1) * FILM_SECONDS * FPS)
  const ff = total % FPS
  const sec = Math.floor(total / FPS)
  const parts = [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60, ff]
  return parts.map((n) => String(n).padStart(2, '0')).join(':')
}

export default function TimecodeHUD({ visible }) {
  const { bar } = useBarHeight()
  const active = useActiveChapter()
  const { scrollYProgress } = useScroll()
  const rail = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })
  const tcRef = useRef(null)

  // Write directly to the DOM so the timecode never re-renders React
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (tcRef.current) tcRef.current.textContent = toTimecode(v)
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.9, delay: visible ? 1.2 : 0 }}
      style={{ height: bar }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 px-4 font-mono text-[10px] tracking-[0.2em] text-smoke sm:px-8 sm:text-[11px]"
    >
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-reveal" />
        <span ref={tcRef} className="text-bone tabular-nums">
          00:00:00:00
        </span>
      </div>

      <div className="flex items-center gap-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={active.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            {active.no} · {active.title.toUpperCase()}
          </motion.span>
        </AnimatePresence>
        <div className="relative hidden h-px w-24 bg-white/15 sm:block">
          <motion.div style={{ scaleX: rail }} className="absolute inset-0 origin-left bg-reveal" />
        </div>
      </div>
    </motion.div>
  )
}