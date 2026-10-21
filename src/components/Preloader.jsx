import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { SEQUENCES, getOrientation } from '../lib/media'
import { loadSequence, onSequenceProgress } from '../lib/frames'

const EASE = [0.22, 1, 0.36, 1]
const SQUEEZE = [0.76, 0, 0.24, 1]
const CRITICAL_FRAMES = 40 // hero frames needed before the site opens
const MAX_WAIT = 15000 // never block longer than this

const CLOSED = 'inset(50% 0% 50% 0%)'
const OPEN = 'inset(0% 0% 0% 0%)'

// Cut times inside intro.mp4 / intro-m.mp4 (seconds) and the word on each cut
const CUTS = [
  { at: 0, word: '' },
  { at: 0.83, word: 'NINE' },
  { at: 1.5, word: 'YEARS' },
  { at: 2.08, word: 'IN' },
  { at: 2.71, word: 'THE' },
  { at: 3.42, word: 'DARK' },
  { at: 4.08, word: 'THEN' },
  { at: 4.75, word: 'LIFTOFF' },
  { at: 5.63, word: '' },
]

export default function Preloader({ onDone }) {
  const videoRef = useRef(null)
  const readyRef = useRef(false)
  const waitingRef = useRef(false)
  const startedRef = useRef(false)
  const timersRef = useRef([])

  const [phase, setPhase] = useState('line') // line → film → (hold) → collapse → ignite
  const [ready, setReady] = useState(false)
  const [cut, setCut] = useState(0)
  const [src] = useState(() =>
    getOrientation() === 'portrait' ? '/media/video/intro-m.mp4' : '/media/video/intro.mp4'
  )

  const load = useMotionValue(0)
  const tc = useMotionValue('00:00:00:00')
  const loadText = useTransform(load, (v) => `${String(Math.round(v * 100)).padStart(3, '0')}%`)

  // Film squeezes into the line, line ignites, bars open
  const startCollapse = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    videoRef.current?.pause()
    setPhase('collapse')
    timersRef.current.push(window.setTimeout(() => setPhase('ignite'), 650))
    timersRef.current.push(window.setTimeout(() => onDone(), 650 + 900))
  }, [onDone])

  // Film finished (or skipped / failed): go if loaded, otherwise hold on the last frame
  const endFilm = useCallback(() => {
    if (startedRef.current) return
    videoRef.current?.pause()
    if (readyRef.current) {
      startCollapse()
    } else {
      waitingRef.current = true
      setPhase('hold')
    }
  }, [startCollapse])

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
      if (waitingRef.current) startCollapse()
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
  }, [load, startCollapse])

  // Line draws, then the film opens out of it
  useEffect(() => {
    if (phase !== 'line') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(() => (reduce ? endFilm() : setPhase('film')), 900)
    return () => clearTimeout(id)
  }, [phase, endFilm])

  // Play the film and sync words + timecode to it
  useEffect(() => {
    if (phase !== 'film') return
    const video = videoRef.current
    if (!video) return
    let raf = 0
    video.currentTime = 0
    video.play().catch(() => endFilm())

    const loop = () => {
      const t = video.currentTime
      let idx = 0
      for (let i = 0; i < CUTS.length; i++) if (t >= CUTS[i].at) idx = i
      setCut((prev) => (prev === idx ? prev : idx))
      const f = Math.floor(t * 24)
      tc.set(`00:00:${String(Math.floor(f / 24)).padStart(2, '0')}:${String(f % 24).padStart(2, '0')}`)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, endFilm, tc])

  // Clear pending timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach(clearTimeout)
  }, [])

  const filmOpen = phase === 'film' || phase === 'hold'
  const hudOn = phase === 'line' || filmOpen

  const bladeAnim =
    phase === 'line'
      ? { scaleX: 1, opacity: 1 }
      : filmOpen
        ? { scaleX: 1, opacity: 0 }
        : phase === 'collapse'
          ? { scaleX: 1, opacity: 1 }
          : { scaleX: 1, opacity: 1, scaleY: [1, 5, 1.5] }
  const bladeTransition =
    phase === 'line'
      ? { duration: 0.8, ease: EASE }
      : filmOpen
        ? { duration: 0.35, delay: 0.25 }
        : phase === 'collapse'
          ? { duration: 0.2, delay: 0.45 }
          : { duration: 0.8, ease: EASE }

  return (
    <motion.div
      initial="show"
      animate="show"
      exit="exit"
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[70]"
    >
      {/* Black backdrop — turns transparent on ignition so the closed letterbox bars take over */}
      <motion.div
        animate={{ opacity: phase === 'ignite' ? 0 : 1 }}
        transition={{ duration: 0.3, delay: phase === 'ignite' ? 0.55 : 0 }}
        className="absolute inset-0 bg-black"
      />

      {/* The film — opens out of the line, squeezes back into it */}
      <motion.div
        initial={{ clipPath: CLOSED }}
        animate={{ clipPath: filmOpen ? OPEN : CLOSED }}
        transition={
          filmOpen ? { duration: 0.8, ease: SQUEEZE } : { duration: 0.55, ease: [0.7, 0, 0.84, 0] }
        }
        className="absolute inset-0"
      >
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          onEnded={endFilm}
          onError={endFilm}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Darkening behind the words + edge scrims for the HUD */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_60%_45%_at_50%_50%,rgb(0_0_0/0.5),transparent_75%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/70 to-transparent" />

        {/* Kinetic words, one per cut */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
          <AnimatePresence mode="popLayout">
            {phase === 'film' && CUTS[cut].word && (
              <motion.p
                key={cut}
                initial={{ opacity: 0, scale: 1.18, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.35, ease: EASE }}
                className="text-legible pl-[0.25em] text-[clamp(3rem,13vw,11rem)] leading-none font-extralight tracking-[0.25em] text-arctic"
              >
                {CUTS[cut].word}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* HUD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hudOn ? 1 : 0 }}
        transition={{ duration: hudOn ? 0.8 : 0.25 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute top-6 left-5 font-mono text-[10px] tracking-[0.3em] text-bone sm:top-9 sm:left-10 sm:text-[11px]">
          ROADSTER <span className="hidden text-smoke sm:inline">— 2028 CONCEPT FILM</span>
        </div>
        <div className="absolute top-6 right-5 font-mono text-[10px] tracking-[0.3em] text-bone tabular-nums sm:top-9 sm:right-10 sm:text-[11px]">
          <motion.span>{tc}</motion.span>
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
          onClick={endFilm}
          className="pointer-events-auto absolute right-3 bottom-3 flex min-h-11 items-center gap-2 px-2 font-mono text-[10px] tracking-[0.3em] text-bone transition-colors hover:text-arctic sm:right-8 sm:bottom-6 sm:text-[11px]"
        >
          SKIP INTRO <ArrowRight size={14} strokeWidth={1.5} />
        </button>

        {/* Loading hairline */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10">
          <motion.div style={{ scaleX: load }} className="h-full origin-left bg-reveal" />
        </div>
      </motion.div>

      {/* The light blade */}
      <motion.div
        variants={{ exit: { opacity: 0, transition: { duration: 1.1, ease: EASE, delay: 0.25 } } }}
        className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center"
      >
        <div className="relative h-px w-[min(56rem,78vw)]">
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={bladeAnim}
            transition={bladeTransition}
            className="absolute inset-0 origin-center bg-arctic shadow-[0_0_10px_1px_rgb(242_242_239/0.8),0_0_40px_4px_rgb(168_220_255/0.35)]"
          />

          {/* Headlight triangles */}
          <motion.svg
            viewBox="0 0 28 20"
            initial={{ opacity: 0, x: 12 }}
            animate={phase === 'ignite' ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="absolute top-1/2 -left-2 h-4 w-6 -translate-x-full -translate-y-1/2 sm:h-5 sm:w-7"
          >
            <path d="M28 2 L28 18 L2 10 Z" fill="#f2f2ef" />
          </motion.svg>
          <motion.svg
            viewBox="0 0 28 20"
            initial={{ opacity: 0, x: -12 }}
            animate={phase === 'ignite' ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="absolute top-1/2 -right-2 h-4 w-6 translate-x-full -translate-y-1/2 sm:h-5 sm:w-7"
          >
            <path d="M0 2 L0 18 L26 10 Z" fill="#f2f2ef" />
          </motion.svg>

          {/* White flare */}
          {phase === 'ignite' && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0.3 }}
              animate={{ opacity: [0, 1, 0], scaleX: [0.3, 1.5, 2] }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 h-28 w-full -translate-x-1/2 -translate-y-1/2 [background:radial-gradient(ellipse_at_center,rgb(255_255_255/0.85),transparent_65%)]"
            />
          )}

          <AnimatePresence>
            {phase === 'ignite' && (
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.2em' }}
                animate={{ opacity: 1, letterSpacing: '0.7em' }}
                transition={{ duration: 0.9, ease: EASE }}
                className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-[10px] whitespace-nowrap text-reveal sm:text-[11px]"
              >
                IGNITION
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}