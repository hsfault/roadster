import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { createSkinScene } from '../lib/skinScene'

const EDGE = 0.001 // keeps scroll input points strictly inside 0..1

const SHOTS = [
  {
    label: 'THE FACE',
    title: 'Two blades of light.',
    body: 'A flat nose, a single sharp wedge of glass, and headlights drawn as thin slashes.',
  },
  {
    label: 'THE DOORS',
    title: 'Open like a canopy.',
    body: 'Gullwing doors rise from the roof and leave the whole cabin exposed.',
  },
  {
    label: 'THE CABIN',
    title: 'Nothing in the way.',
    body: 'Red ambient light, pale seats and one screen. The interior is mostly empty on purpose.',
  },
  {
    label: 'THE SUSPENSION',
    title: 'Jewellery you never see.',
    body: 'Gold coil springs on an exposed frame. The part usually hidden, shown like a watch movement.',
  },
  {
    label: 'THE TAIL',
    title: 'One line across the back.',
    body: 'A full-width red light bar above the ports. The last thing anyone sees.',
  },
]

// Scroll range where shot i is visible (all points strictly inside 0..1)
function span(i, n) {
  const c = i / (n - 1)
  const first = i === 0
  const last = i === n - 1
  return [
    first ? 0 : c - 0.14,
    first ? EDGE : c - 0.07,
    last ? 1 - EDGE : c + 0.07,
    last ? 1 : c + 0.14,
  ]
}

function Caption({ i, n, progress, shot }) {
  const input = span(i, n)
  const first = i === 0
  const last = i === n - 1
  const opacity = useTransform(progress, input, [first ? 1 : 0, 1, 1, last ? 1 : 0])
  const y = useTransform(progress, input, [first ? 0 : 24, 0, 0, last ? 0 : -24])
  const right = i % 2 === 0 // photo is on the left, so text goes right

  return (
    <motion.div
      style={{ opacity, y }}
      className={`pointer-events-none absolute right-5 bottom-[15svh] left-5 sm:max-w-sm ${
        right ? 'sm:right-12 sm:left-auto sm:text-right' : 'sm:right-auto sm:left-12'
      }`}
    >
      <p className="text-legible font-mono text-[10px] tracking-[0.35em] text-reveal sm:text-[11px]">
        {shot.label}
      </p>
      <h3 className="text-legible mt-3 text-2xl font-extralight tracking-tight text-arctic sm:text-4xl">
        {shot.title}
      </h3>
      <p className="text-legible mt-3 text-sm leading-relaxed text-bone sm:text-base">{shot.body}</p>
    </motion.div>
  )
}

export default function Skin() {
  const ref = useRef(null)
  const canvasRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const n = SHOTS.length

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const hintOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0])
  const counter = useTransform(
    scrollYProgress,
    (v) => `0${Math.min(n, Math.round(Math.min(1, Math.max(0, v)) * (n - 1)) + 1)} / 0${n}`
  )

  useEffect(() => {
    const canvas = canvasRef.current
    let scene
    try {
      scene = createSkinScene(canvas, () => scrollYProgress.get())
    } catch {
      setFailed(true)
      return
    }

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
    }
  }, [scrollYProgress])

  return (
    <section id="skin" data-chapter="08" ref={ref} className="relative h-[600svh] bg-void">
      <div className="sticky top-0 h-svh overflow-hidden bg-void">
        {failed ? (
          <img
            src="/media/img/tesla-spring.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : (
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        )}

        {/* Readability layers */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_40%,rgb(5_5_6/0.75)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-linear-to-t from-void/90 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[24%] bg-linear-to-b from-void/80 to-transparent" />

        {/* Chapter label */}
        <p className="text-legible absolute top-[16%] left-5 font-mono text-[10px] tracking-[0.35em] text-reveal sm:left-12 sm:text-[11px]">
          08 — UNDER THE SKIN
        </p>

        {/* Counter */}
        <motion.p className="text-legible absolute top-[16%] right-5 font-mono text-[10px] tracking-[0.3em] text-bone sm:right-12 sm:text-[11px]">
          {counter}
        </motion.p>

        {/* Captions */}
        {SHOTS.map((shot, i) => (
          <Caption key={shot.label} i={i} n={n} progress={scrollYProgress} shot={shot} />
        ))}

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute inset-x-0 top-[28%] text-center"
        >
          <span className="text-legible font-mono text-[10px] tracking-[0.35em] text-bone">
            KEEP SCROLLING — FLY THROUGH
          </span>
        </motion.div>
      </div>
    </section>
  )
}