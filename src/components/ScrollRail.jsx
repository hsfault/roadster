import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import useActiveChapter from '../hooks/useActiveChapter'
import { CHAPTERS } from '../lib/chapters'
import { scrollToId } from '../lib/smoothScroll'

// A small wireframe Roadster that turns slowly and spins faster as you scroll
function createCar(canvas, getSpeed) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 112 / 72, 0.1, 50)
  camera.position.set(0, 1.6, 8.5)
  camera.lookAt(0, 0.6, 0)

  const disposables = []
  const group = new THREE.Group()

  // Side profile of the wedge, extruded across the width of the car
  const pts = [
    [-2.3, 0.15],
    [-2.3, 0.42],
    [-0.95, 0.78],
    [-0.25, 1.22],
    [0.9, 1.28],
    [1.85, 0.92],
    [2.3, 0.72],
    [2.3, 0.15],
  ]
  const shape = new THREE.Shape()
  shape.moveTo(pts[0][0], pts[0][1])
  pts.slice(1).forEach((p) => shape.lineTo(p[0], p[1]))
  shape.closePath()

  const body = new THREE.ExtrudeGeometry(shape, { depth: 1.6, bevelEnabled: false })
  body.translate(0, 0, -0.8)
  const bodyEdges = new THREE.EdgesGeometry(body, 25)
  const lineMat = new THREE.LineBasicMaterial({ color: 0xf2f2ef, transparent: true, opacity: 0.9 })
  group.add(new THREE.LineSegments(bodyEdges, lineMat))
  disposables.push(body, bodyEdges, lineMat)

  // Wheels
  const torus = new THREE.TorusGeometry(0.4, 0.09, 8, 24)
  const wheelEdges = new THREE.EdgesGeometry(torus, 30)
  disposables.push(torus, wheelEdges)
  ;[
    [-1.3, 0.8],
    [1.3, 0.8],
    [-1.3, -0.8],
    [1.3, -0.8],
  ].forEach(([x, z]) => {
    const w = new THREE.LineSegments(wheelEdges, lineMat)
    w.position.set(x, 0.4, z)
    group.add(w)
  })

  // Red tail light bar
  const barGeo = new THREE.BoxGeometry(0.03, 0.05, 1.5)
  const barMat = new THREE.MeshBasicMaterial({ color: 0xe3262f })
  const bar = new THREE.Mesh(barGeo, barMat)
  bar.position.set(2.31, 0.58, 0)
  group.add(bar)
  disposables.push(barGeo, barMat)

  group.rotation.x = 0.18
  scene.add(group)

  let raf = 0
  let last = performance.now()
  let yaw = 0.6
  let running = true

  const frame = (now) => {
    if (!running) return
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    yaw += (0.5 + Math.min(6, Math.abs(getSpeed()) * 40)) * dt
    group.rotation.y = yaw
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(frame)

  return {
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
    },
  }
}

// One chapter tick: leans toward the pointer, grows and shows its name when you're near
function Tick({ chapter, frac, pointerY, railHRef, isActive }) {
  const near = useTransform(pointerY, (py) => {
    const y = frac * railHRef.current
    return Math.max(0, 1 - Math.abs(py - y) / 70)
  })
  const x = useSpring(
    useTransform(near, (n) => -n * 18),
    { stiffness: 220, damping: 20 }
  )
  const width = useTransform(near, (n) => 10 + n * 22)
  const labelOpacity = useTransform(near, [0.35, 0.7], [0, 1])

  return (
    <motion.button
      type="button"
      onClick={() => scrollToId(`#${chapter.id}`)}
      aria-label={`Go to chapter ${chapter.no}, ${chapter.title}`}
      style={{ top: `${frac * 100}%`, x }}
      className="pointer-events-auto absolute right-0 flex h-11 -translate-y-1/2 items-center justify-end gap-3"
    >
      <motion.span
        style={{ opacity: labelOpacity }}
        className="text-legible font-mono text-[10px] tracking-[0.25em] whitespace-nowrap text-bone"
      >
        {chapter.no} {chapter.title.toUpperCase()}
      </motion.span>
      <motion.span
        style={{ width }}
        className={`block h-px ${isActive ? 'bg-reveal' : 'bg-arctic/60'}`}
      />
    </motion.button>
  )
}

export default function ScrollRail({ visible }) {
  const active = useActiveChapter()
  const railRef = useRef(null)
  const canvasRef = useRef(null)
  const railHRef = useRef(400)
  const pointerY = useMotionValue(-9999)
  const [fracs, setFracs] = useState(() => CHAPTERS.map((_, i) => i / (CHAPTERS.length - 1)))

  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.6 })
  const carTop = useTransform(smooth, (v) => `${v * 100}%`)

  // Where each chapter starts, as a fraction of the whole page
  useEffect(() => {
    const measure = () => {
      if (railRef.current) railHRef.current = railRef.current.clientHeight
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      setFracs(
        CHAPTERS.map((c) => {
          const el = document.getElementById(c.id)
          if (!el) return 0
          const top = el.getBoundingClientRect().top + window.scrollY
          return Math.min(1, Math.max(0, top / max))
        })
      )
    }
    measure()
    const t = window.setTimeout(measure, 1500)
    window.addEventListener('resize', measure)
    window.addEventListener('load', measure)
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('load', measure)
      ro.disconnect()
    }
  }, [])

  // The 3D car (desktop only)
  useEffect(() => {
    if (!window.matchMedia('(min-width: 768px)').matches) return
    let car
    try {
      car = createCar(canvasRef.current, () => smooth.getVelocity())
    } catch {
      return
    }
    return () => car.dispose()
  }, [smooth])

  const onMove = (e) => {
    const r = railRef.current?.getBoundingClientRect()
    if (r) pointerY.set(e.clientY - r.top)
  }
  const onLeave = () => pointerY.set(-9999)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 1, delay: visible ? 1.4 : 0 }}
      className="pointer-events-none fixed top-1/2 right-16 z-[60] hidden h-[58svh] w-0 -translate-y-1/2 md:block"
    >
      <div ref={railRef} className="absolute inset-0">
        {/* Line + progress fill */}
        <div className="absolute inset-y-0 right-0 w-px bg-white/15" />
        <motion.div
          style={{ scaleY: smooth }}
          className="absolute inset-y-0 right-0 w-px origin-top bg-reveal"
        />

        {/* Magnetic ticks */}
        <div
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="pointer-events-auto absolute inset-y-0 right-0 w-44"
        >
          {CHAPTERS.map((c, i) => (
            <Tick
              key={c.id}
              chapter={c}
              frac={fracs[i]}
              pointerY={pointerY}
              railHRef={railHRef}
              isActive={active?.id === c.id}
            />
          ))}
        </div>

        {/* The car riding the rail */}
        <motion.div
          style={{ top: carTop }}
          className="pointer-events-none absolute right-0 h-[72px] w-[112px] translate-x-1/2 -translate-y-1/2"
        >
          <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />
        </motion.div>
      </div>
    </motion.div>
  )
}