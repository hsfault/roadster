import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import FrameSequence from '../components/FrameSequence'

const EASE = [0.22, 1, 0.36, 1]
const LETTERS = 'ROADSTER'.split('')

export default function Hero({ ready }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // Scroll choreography (0 → 1 across the pinned section)
  const frames = useTransform(scrollYProgress, [0, 0.82], [0, 1])
  const zoom = useTransform(scrollYProgress, [0, 1], [1.08, 1])
  const introOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])
  const introY = useTransform(scrollYProgress, [0, 0.1], [0, -50])
  const cueOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0])
  const outroOpacity = useTransform(scrollYProgress, [0.74, 0.86], [0, 1])
  const outroY = useTransform(scrollYProgress, [0.74, 0.86], [40, 0])
  const blackout = useTransform(scrollYProgress, [0.9, 1], [0, 1])

  return (
    <section id="return" data-chapter="01" ref={ref} className="relative h-[320svh] bg-void">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* The film */}
        <motion.div style={{ scale: zoom }} className="absolute inset-0 will-change-transform">
          <FrameSequence name="hero" progress={frames} eager />
        </motion.div>

        {/* Readability layers */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[38%] bg-linear-to-b from-void via-void/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-linear-to-t from-void to-transparent" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_50%,rgb(5_5_6/0.7)_100%)]" />
        <motion.div
          style={{ opacity: outroOpacity }}
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] bg-linear-to-r from-void/85 via-void/35 to-transparent sm:block"
        />
        <motion.div style={{ opacity: blackout }} className="pointer-events-none absolute inset-0 bg-void" />

        {/* Intro title */}
        <motion.div
          style={{ opacity: introOpacity, y: introY }}
          className="absolute inset-x-0 top-[17%] px-4 text-center sm:top-[15%]"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="font-mono text-[10px] tracking-[0.35em] text-smoke sm:text-[11px]"
          >
            2028 CONCEPT · CHAPTER 01
          </motion.p>

          <h1
            aria-label="Roadster"
            className="text-legible mt-5 flex justify-center pl-[0.32em] font-display text-[clamp(2.3rem,10vw,8rem)] leading-none font-extralight tracking-[0.32em] text-arctic"
          >
            {LETTERS.map((letter, i) => (
              <motion.span
                key={i}
                aria-hidden="true"
                initial={{ opacity: 0, y: '0.35em', filter: 'blur(12px)' }}
                animate={ready ? { opacity: 1, y: '0em', filter: 'blur(0px)' } : undefined}
                transition={{ duration: 1.2, delay: 0.7 + i * 0.07, ease: EASE }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 1.1, delay: 1.45, ease: EASE }}
            className="text-legible mt-6 text-base font-light tracking-wide text-bone sm:text-xl"
          >
            Nine years in the dark. Worth every one.
          </motion.p>
        </motion.div>

        {/* Outro text: top on phones (dark sky), bottom-left on desktop */}
        <motion.div
          style={{ opacity: outroOpacity, y: outroY }}
          className="absolute top-[15%] right-4 left-4 max-w-xl sm:top-auto sm:right-auto sm:bottom-[16%] sm:left-12"
        >
          <p className="font-mono text-[10px] tracking-[0.35em] text-reveal sm:text-[11px]">
            01 — THE RETURN
          </p>
          <h2 className="text-legible mt-4 text-3xl font-medium tracking-tight text-arctic sm:text-5xl">
            Then the lights came on.
          </h2>
          <p className="text-legible mt-4 max-w-md text-sm leading-relaxed font-light text-bone sm:text-base">
            Low, wide and cut from flat planes of glass and light — a two-door that looks folded
            rather than built.
          </p>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ delay: 2.1, duration: 1 }}
          className="pointer-events-none absolute inset-0"
        >
          <motion.div
            style={{ opacity: cueOpacity }}
            className="absolute inset-x-0 bottom-[11%] flex flex-col items-center gap-3"
          >
            <span className="text-legible font-mono text-[10px] tracking-[0.35em] text-bone">
              SCROLL TO IGNITE
            </span>
            <span className="relative h-10 w-px overflow-hidden bg-white/15">
              <span className="scroll-cue-line absolute inset-0 bg-reveal" />
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}