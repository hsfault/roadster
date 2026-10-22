import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { SEQUENCES, getOrientation } from '../lib/media'
import { loadSequence, onSequenceProgress } from '../lib/frames'
import Wordmark from './Wordmark'

const EASE = [0.22, 1, 0.36, 1]
const HINGE = [0.76, 0, 0.24, 1]
const CRITICAL_FRAMES = 40 // hero frames needed before the site opens
const MAX_WAIT = 15000 // never block longer than this
const MIN_SHOW = 2600 // splash always shows at least this long (ms)
const CHARGE_MS = 500 // line flares before the split
const BLUEPRINT = "url('/media/img/blueprint.webp')"

// Gullwing Split: the blueprint car is cut in half by the light line,
// then both halves hinge away in 3D and the hero is revealed behind them.
export default function Preloader({ onDone }) {
  const readyRef = useRef(false)
  const minRef = useRef(false)
  const startedRef = useRef(false)
  const timersRef = useRef([])

  const [phase, setPhase] = useState('line') // line → charge → split
  const [ready, setReady] = useState(false)

  const load = useMotionValue(0)
  const loadText = useTransform(load, (v) => `${String(Math.round(v * 100)).padStart(3, '0')}%`)

  // Starts the split once hero frames are loaded AND the minimum time has passed
  const tryStart = useCallback(() => {
    if (startedRef.current || !readyRef.current || !minRef.current) return
    startedRef.current = true
    setPhase('charge')
    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('split')
        onDone() // letterbox bars open at the same moment the doors lift
      }, CHARGE_MS)
    )
  }, [onDone])

  // Minimum show time
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(
      () => {
        minRef.current = true
        tryStart()
      },
      reduce ? 300 : MIN_SHOW
    )
    return () => clearTimeout(id)
  }, [tryStart])

  // Loading: hero frames + fonts
  useEffect(() => {
    let alive = true
    let frames = 0
    let fonts = 0
    const entry = loadSequence(SEQUENCES.hero[getOrientation()])
    const critical = Math.min(entry.count, CRITICAL_FRAMES)

    const markReady = () => {
      if (!alive || readyRef.current) return
      readyRef.current = true
      setReady(true)
      tryStart()
    }
    const update = () => {
      const v = frames * 0.9 + fonts * 0.1
      load.set(v)
      if (v >= 0.999) markReady()
    }

    const off = onSequenceProgress(entry, (p) => {
      frames = Math.min(1, (p * entry.count) / critical)
      update()
    })
    ;(document.fonts?.ready ?? Promise.resolve()).then(() => {
      fonts = 1
      update()
    })
    const safety = window.setTimeout(() => {
      load.set(1)
      markReady()
    }, MAX_WAIT)

    return () => {
      alive = false
      off()
      clearTimeout(safety)
    }
  }, [load, tryStart])

  // Clear pending timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach(clearTimeout)
  }, [])

  const skip = () => {
    minRef.current = true
    tryStart()
  }

  const split = phase === 'split'
  const charge = phase === 'charge'
  const hudOn = !split

  const panelTransition = split
    ? {
        rotateX: { duration: 1.5, ease: HINGE },
        y: { duration: 1.5, ease: HINGE },
        opacity: { duration: 0.5, delay: 1.0 },
      }
    : { duration: 0.9, delay: 0.2 }

  const bladeAnim = split
    ? { scaleX: 1, scaleY: 8, opacity: 0 }
    : charge
      ? { scaleX: 1, scaleY: [1, 4], opacity: 1 }
      : { scaleX: 1, scaleY: 1, opacity: 1 }
  const bladeTransition = split
    ? { duration: 0.35, ease: 'easeOut' }
    : charge
      ? { duration: 0.45, ease: EASE }
      : { duration: 0.9, ease: EASE }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 1.7 } }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[70] overflow-hidden"
    >
      {/* Backdrop — fades away as the doors lift */}
      <motion.div
        animate={{ opacity: split ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 bg-void"
      />

      {/* The two gullwing halves */}
      <div
        className="absolute inset-0"
        style={{ perspective: '1400px', perspectiveOrigin: '50% 50%' }}
      >
        {/* Top half — hinges at the top edge */}
        <motion.div
          initial={{ opacity: 0, rotateX: 0, y: 0 }}
          animate={split ? { rotateX: -84, y: '-8%', opacity: 0 } : { rotateX: 0, y: 0, opacity: 1 }}
          transition={panelTransition}
          style={{ transformOrigin: '50% 0%', backfaceVisibility: 'hidden' }}
          className="absolute inset-x-0 top-0 h-1/2 overflow-hidden bg-void will-change-transform"
        >
          <motion.div
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 3, ease: EASE }}
            style={{ backgroundImage: BLUEPRINT }}
            className="absolute inset-x-0 top-0 h-[200%] bg-cover bg-center opacity-60"
          />
          <div className="absolute inset-0 [background:radial-gradient(ellipse_70%_90%_at_50%_100%,transparent,rgb(5_5_6/0.75))]" />
          <motion.div
            animate={{ opacity: charge ? 1 : 0.4 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-arctic/30 to-transparent"
          />
        </motion.div>

        {/* Bottom half — hinges at the bottom edge */}
        <motion.div
          initial={{ opacity: 0, rotateX: 0, y: 0 }}
          animate={split ? { rotateX: 84, y: '8%', opacity: 0 } : { rotateX: 0, y: 0, opacity: 1 }}
          transition={panelTransition}
          style={{ transformOrigin: '50% 100%', backfaceVisibility: 'hidden' }}
          className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden bg-void will-change-transform"
        >
          <motion.div
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 3, ease: EASE }}
            style={{ backgroundImage: BLUEPRINT }}
            className="absolute inset-x-0 bottom-0 h-[200%] bg-cover bg-center opacity-60"
          />
          <div className="absolute inset-0 [background:radial-gradient(ellipse_70%_90%_at_50%_0%,transparent,rgb(5_5_6/0.75))]" />
          <motion.div
            animate={{ opacity: charge ? 1 : 0.4 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-arctic/30 to-transparent"
          />
        </motion.div>
      </div>

      {/* Light spilling out of the gap */}
      {split && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scaleY: 0.05, opacity: 0 }}
            animate={{ scaleY: [0.05, 1, 1.1], opacity: [0, 1, 0] }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
            className="h-[60vh] w-full [background:linear-gradient(to_bottom,transparent,rgb(255_255_255/0.85)_50%,transparent)]"
          />
        </div>
      )}

      {/* The light blade */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
        <div className="relative h-px w-[min(56rem,78vw)]">
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={bladeAnim}
            transition={bladeTransition}
            className="absolute inset-0 origin-center bg-arctic shadow-[0_0_10px_1px_rgb(242_242_239/0.8),0_0_40px_4px_rgb(168_220_255/0.35)]"
          />
        </div>
      </div>

      {/* Scrims so HUD text never blends into the artwork */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/70 to-transparent" />

      {/* HUD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hudOn ? 1 : 0 }}
        transition={{ duration: hudOn ? 0.8 : 0.25, delay: hudOn ? 0.3 : 0 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute top-6 left-5 flex items-center gap-3 sm:top-9 sm:left-10">
          <Wordmark className="w-24 sm:w-32" />
          <span className="hidden font-mono text-[11px] tracking-[0.3em] text-smoke sm:inline">
            — 2028 CONCEPT
          </span>
        </div>
        <div className="absolute top-6 right-5 font-mono text-[10px] tracking-[0.3em] sm:top-9 sm:right-10 sm:text-[11px]">
          <span className="text-smoke">DOORS </span>
          <span className={charge ? 'text-reveal' : 'text-bone'}>{charge ? 'RELEASING' : 'LOCKED'}</span>
        </div>

        <div className="absolute bottom-6 left-5 font-mono text-[10px] tracking-[0.3em] sm:bottom-9 sm:left-10 sm:text-[11px]">
          {ready ? (
            <span className="text-arctic">READY</span>
          ) : (
            <span className="text-smoke">
              LOADING <motion.span className="text-bone tabular-nums">{loadText}</motion.span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={skip}
          className="pointer-events-auto absolute right-3 bottom-3 flex min-h-11 items-center gap-2 px-2 font-mono text-[10px] tracking-[0.3em] text-bone transition-colors hover:text-arctic sm:right-8 sm:bottom-6 sm:text-[11px]"
        >
          SKIP INTRO <ArrowRight size={14} strokeWidth={1.5} />
        </button>

        {/* Loading hairline */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10">
          <motion.div style={{ scaleX: load }} className="h-full origin-left bg-reveal" />
        </div>
      </motion.div>
    </motion.div>
  )
}