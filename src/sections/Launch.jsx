import { useEffect, useRef } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import FrameSequence from '../components/FrameSequence'
import { createStreaks } from '../lib/streakScene'

export default function Launch() {
  const ref = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const frames = useTransform(scrollYProgress, [0, 0.85], [0, 1])
  const zoom = useTransform(scrollYProgress, [0, 1], [1.04, 1])
  const speed = useTransform(scrollYProgress, [0, 0.38, 0.55, 0.85, 0.95], [0, 0, 1, 1, 0])

  const aOpacity = useTransform(scrollYProgress, [0.03, 0.12, 0.3, 0.38], [0, 1, 1, 0])
  const aY = useTransform(scrollYProgress, [0.03, 0.12, 0.3, 0.38], [30, 0, 0, -30])
  const bOpacity = useTransform(scrollYProgress, [0.5, 0.58, 0.8, 0.88], [0, 1, 1, 0])
  const bY = useTransform(scrollYProgress, [0.5, 0.58, 0.8, 0.88], [30, 0, 0, -30])
  const blackout = useTransform(scrollYProgress, [0.93, 1], [0, 1])

  // Three.js streak layer — runs only while this chapter is on screen
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    let scene
    try {
      scene = createStreaks(canvas)
    } catch {
      return
    }
    sceneRef.current = scene

    const ro = new ResizeObserver(() => scene.resize())
    ro.observe(canvas)
    scene.resize()

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) scene.start()
      else scene.stop()
    })
    io.observe(ref.current)

    return () => {
      io.disconnect()
      ro.disconnect()
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  useMotionValueEvent(speed, 'change', (v) => sceneRef.current?.setSpeed(v))

  return (
    <section id="launch" data-chapter="06" ref={ref} className="relative h-[380svh] bg-void">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* The film */}
        <motion.div style={{ scale: zoom }} className="absolute inset-0 will-change-transform">
          <FrameSequence name="launch" progress={frames} />
        </motion.div>

        {/* Light streaks (Three.js), aimed at the runway's vanishing point */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full translate-y-[6%]"
        />

        {/* Readability layers */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-linear-to-b from-void/90 via-void/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[20%] bg-linear-to-t from-void to-transparent" />
        <motion.div style={{ opacity: blackout }} className="pointer-events-none absolute inset-0 bg-void" />

        {/* Beat A */}
        <motion.div
          style={{ opacity: aOpacity, y: aY }}
          className="absolute top-[15%] right-4 left-4 max-w-xl sm:right-auto sm:left-12"
        >
          <p className="font-mono text-[10px] tracking-[0.35em] text-reveal sm:text-[11px]">
            06 — LAUNCH SEQUENCE
          </p>
          <h2 className="text-legible mt-4 text-3xl font-extralight tracking-tight text-arctic sm:text-5xl">
            Hold it still.
          </h2>
          <p className="text-legible mt-4 max-w-md text-sm leading-relaxed text-bone sm:text-base">
            Wet runway, engines of light, every pipe pointed at the dark.
          </p>
        </motion.div>

        {/* Beat B */}
        <motion.div
          style={{ opacity: bOpacity, y: bY }}
          className="absolute top-[15%] right-4 left-4 max-w-xl sm:right-auto sm:left-12"
        >
          <p className="font-mono text-[10px] tracking-[0.35em] text-reveal sm:text-[11px]">
            06 — LAUNCH SEQUENCE
          </p>
          <h2 className="text-legible mt-4 text-3xl font-extralight tracking-tight text-arctic sm:text-5xl">
            Then let it go.
          </h2>
          <p className="text-legible mt-4 max-w-md text-sm leading-relaxed text-bone sm:text-base">
            The thrusters fire, the smoke closes in, and the Roadster is a pair of red lights
            getting smaller.
          </p>
        </motion.div>
      </div>
    </section>
  )
}