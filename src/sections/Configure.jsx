import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'

const SKEW = '20svh' // horizontal shift of the sweep edge from top to bottom (matches skewX -11.31deg)

const PAINTS = [
  {
    id: 'black',
    name: 'Obsidian',
    note: 'A black that swallows the room and gives light back only along the edges.',
    img: '/media/img/paint-black.webp',
    fill: 'radial-gradient(circle at 30% 25%, #3a3a40, #050506 70%)',
  },
  {
    id: 'grey',
    name: 'Gunmetal',
    note: 'Cold, flat grey that turns every plane into a different shade of the same night.',
    img: '/media/img/paint-grey.webp',
    fill: 'radial-gradient(circle at 30% 25%, #b4b4bb, #5a5a62 70%)',
  },
  {
    id: 'white',
    name: 'Arctic',
    note: 'Pearl white that holds the light instead of reflecting it away.',
    img: '/media/img/paint-white.webp',
    fill: 'radial-gradient(circle at 30% 25%, #ffffff, #c9c9c4 70%)',
  },
]

export default function Configure() {
  const ref = useRef(null)
  const busyRef = useRef(false)
  const [state, setState] = useState({ cur: 0, prev: 0 })
  const p = useMotionValue(1) // 0 → 1 while the light sweeps across

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const stackScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.14, 1.08, 1.14])
  const uiOpacity = useTransform(scrollYProgress, [0.15, 0.3, 0.75, 0.9], [0, 1, 1, 0])

  // The sweep: slanted edge travelling left → right
  const clip = useTransform(
    p,
    (v) =>
      `polygon(0% 0%, calc(${v} * (100% + ${SKEW})) 0%, calc(${v} * (100% + ${SKEW}) - ${SKEW}) 100%, 0% 100%)`
  )
  const barLeft = useTransform(p, (v) => `calc(${v} * (100% + ${SKEW}))`)
  const barOpacity = useTransform(p, [0, 0.05, 0.9, 1], [0, 1, 1, 0])

  // Lift: the car rises off the floor mid-sweep, then settles
  const lift = useTransform(p, [0, 0.5, 1], [0, 1, 0])
  const liftY = useTransform(lift, (l) => `${l * -2.4}%`)
  const glowOpacity = useTransform(lift, [0, 1], [0, 0.55])

  // Pointer tilt (3D)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [2.2, -2.2]), { stiffness: 90, damping: 18 })
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-3.2, 3.2]), { stiffness: 90, damping: 18 })
  const rotateX = useTransform([tiltX, lift], ([t, l]) => t + l * 3)
  const scale = useTransform([stackScale, lift], ([s, l]) => s * (1 + l * 0.045))
  // Text drifts slightly against the image for depth
  const textX = useTransform(mx, [-0.5, 0.5], [10, -10])

  const onPointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onPointerLeave = () => {
    mx.set(0)
    my.set(0)
  }

  // Preload all three paints so switching never flashes
  useEffect(() => {
    PAINTS.forEach((paint) => {
      const img = new Image()
      img.src = paint.img
    })
  }, [])

  const select = (index) => {
    if (busyRef.current || index === state.cur) return
    busyRef.current = true
    setState((s) => ({ cur: index, prev: s.cur }))
    p.set(0)
    animate(p, 1, {
      duration: 1.15,
      ease: [0.76, 0, 0.24, 1],
      onComplete: () => {
        setState((s) => ({ cur: s.cur, prev: s.cur }))
        busyRef.current = false
      },
    })
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      select((state.cur + 1) % PAINTS.length)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      select((state.cur - 1 + PAINTS.length) % PAINTS.length)
    }
  }

  const current = PAINTS[state.cur]
  const previous = PAINTS[state.prev]

  return (
    <section
      id="configure"
      data-chapter="07"
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative h-svh overflow-hidden bg-void"
    >
      {/* Paint images in a 3D scene: previous underneath, new one revealed by the sweep */}
      <div className="absolute inset-0" style={{ perspective: 1400 }}>
        <motion.div
          style={{ rotateX, rotateY: tiltY, y: liftY, scale }}
          className="absolute inset-0 will-change-transform"
        >
          <img
            src={previous.img}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable="false"
          />
          <motion.img
            src={current.img}
            alt={`Roadster in ${current.name}`}
            style={{ clipPath: clip }}
            className="absolute inset-0 h-full w-full object-cover"
            draggable="false"
          />
        </motion.div>
      </div>

      {/* Glow under the car while it lifts */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: glowOpacity }}
        className="pointer-events-none absolute inset-x-[15%] bottom-[22%] h-[18%] [background:radial-gradient(ellipse_at_center,rgb(168_220_255/0.55),transparent_70%)]"
      />

      {/* The light edge of the sweep */}
      <motion.div
        aria-hidden="true"
        style={{ left: barLeft, opacity: barOpacity }}
        className="pointer-events-none absolute inset-y-0 w-0"
      >
        <div className="h-full w-[3px] origin-top-left [transform:skewX(-11.31deg)] bg-arctic shadow-[0_0_14px_2px_rgb(242_242_239/0.9),0_0_60px_10px_rgb(168_220_255/0.45)]" />
      </motion.div>

      {/* Readability layers */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_45%,rgb(5_5_6/0.7)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40%] bg-linear-to-b from-void/90 via-void/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-linear-to-t from-void/90 to-transparent" />

      <motion.div style={{ opacity: uiOpacity }} className="absolute inset-0">
        {/* Title + paint name */}
        <motion.div
          style={{ x: textX }}
          className="absolute top-[16%] right-5 left-5 max-w-xl sm:right-auto sm:left-12"
        >
          <p className="font-mono text-[10px] tracking-[0.35em] text-reveal sm:text-[11px]">
            07 — CHOOSE YOUR LIGHT
          </p>

          <div aria-live="polite" className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="text-legible text-4xl font-extralight tracking-tight text-arctic sm:text-6xl">
                  {current.name}
                </h2>
                <p className="text-legible mt-4 max-w-md text-sm leading-relaxed text-bone sm:text-base">
                  {current.note}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Swatches */}
        <div className="absolute inset-x-0 bottom-[16svh] flex flex-col items-center gap-4">
          <div
            role="radiogroup"
            aria-label="Paint finish"
            onKeyDown={onKeyDown}
            className="flex items-start gap-8 sm:gap-12"
          >
            {PAINTS.map((paint, i) => {
              const active = i === state.cur
              return (
                <button
                  key={paint.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={paint.name}
                  tabIndex={active ? 0 : -1}
                  onClick={() => select(i)}
                  className="group flex min-h-11 min-w-11 flex-col items-center gap-3"
                >
                  <span
                    className={`relative block h-14 w-14 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      active ? 'scale-100' : 'scale-[0.78] group-hover:scale-90'
                    }`}
                    style={{ background: paint.fill }}
                  >
                    <span
                      className={`absolute -inset-[6px] rounded-full border transition-all duration-500 ${
                        active ? 'border-arctic opacity-100' : 'border-white/0 opacity-0'
                      }`}
                    />
                    <span className="absolute inset-0 rounded-full ring-1 ring-white/25 ring-inset" />
                  </span>
                  <span
                    className={`text-legible font-mono text-[10px] tracking-[0.3em] uppercase transition-colors duration-300 ${
                      active ? 'text-arctic' : 'text-smoke group-hover:text-bone'
                    }`}
                  >
                    {paint.name}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-legible font-mono text-[10px] tracking-[0.3em] text-smoke">
            FINISH 0{state.cur + 1} / 0{PAINTS.length}
          </p>
        </div>
      </motion.div>
    </section>
  )
}