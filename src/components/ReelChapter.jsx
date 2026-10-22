import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

function useDesktop() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

const FLAT_CLOSED = 'inset(50% 0% 50% 0%)'
const FLAT_OPEN = 'inset(0% 0% 0% 0%)'
const SLANT_CLOSED = 'polygon(14% 50%, 100% 50%, 86% 50%, 0% 50%)'
const SLANT_OPEN = 'polygon(14% 0%, 100% 0%, 86% 100%, 0% 100%)'

// A pinned chapter that opens out of a line and plays one video.
// portrait = true → slanted tall panel on desktop, full-bleed on mobile.
export default function ReelChapter({
  id,
  no,
  title,
  headline,
  body,
  src,
  portrait = false,
  textSide = 'left',
}) {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const desktop = useDesktop()
  const slanted = portrait && desktop

  // 0→1 while the chapter scrolls into view (the line opens)
  const { scrollYProgress: enter } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start start'],
  })
  // 0→1 while the chapter is pinned
  const { scrollYProgress: stay } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  const clipFlat = useTransform(enter, [0, 1], [FLAT_CLOSED, FLAT_OPEN])
  const clipSlant = useTransform(enter, [0, 1], [SLANT_CLOSED, SLANT_OPEN])
  const scale = useTransform(stay, [0, 1], [1, 1.1])
  const textOpacity = useTransform(stay, [0.06, 0.2, 0.82, 0.95], [0, 1, 1, 0])
  const textY = useTransform(stay, [0.06, 0.2, 0.82, 0.95], [40, 0, 0, -40])
  const glow = useTransform(stay, [0, 0.3, 1], [0, 0.9, 0.4])
  const lineOpacity = useTransform(enter, [0, 0.6, 1], [1, 1, 0])

  // Play only while the chapter is on screen
  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.15 }
    )
    io.observe(section)
    return () => io.disconnect()
  }, [])

  const panelClass = slanted
    ? `absolute inset-y-0 w-[46vw] ${textSide === 'left' ? 'right-[7vw]' : 'left-[7vw]'}`
    : 'absolute inset-0'

  const textClass = slanted
    ? `absolute top-1/2 w-[34vw] -translate-y-1/2 ${textSide === 'left' ? 'left-[7vw]' : 'right-[7vw]'}`
    : 'absolute bottom-[16svh] left-5 right-5 sm:left-10 sm:right-auto sm:max-w-xl'

  return (
    <section
      ref={sectionRef}
      id={id}
      data-chapter={no}
      className="relative h-[240svh] bg-void"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Soft red glow behind the slanted panel */}
        {slanted && (
          <motion.div
            style={{ opacity: glow }}
            className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_40%_60%_at_65%_50%,rgb(227_38_47/0.22),transparent_70%)]"
          />
        )}

        {/* Giant outlined chapter number */}
        <motion.p
          aria-hidden="true"
          style={{ opacity: textOpacity }}
          className={`text-outline pointer-events-none absolute top-1/2 -translate-y-1/2 font-mono text-[clamp(8rem,28vw,26rem)] leading-none font-extralight ${
            textSide === 'left' ? 'left-[3vw]' : 'right-[3vw]'
          } ${slanted ? 'opacity-40' : 'hidden'}`}
        >
          {no}
        </motion.p>

        {/* The video, opening out of a line */}
        <motion.div style={{ clipPath: slanted ? clipSlant : clipFlat }} className={panelClass}>
          <motion.video
            ref={videoRef}
            src={src}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            style={{ scale }}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30" />
        </motion.div>

        {/* The light line before the chapter opens */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: lineOpacity }}
          className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center"
        >
          <div className="h-px w-[min(56rem,78vw)] bg-arctic shadow-[0_0_10px_1px_rgb(242_242_239/0.8),0_0_40px_4px_rgb(168_220_255/0.35)]" />
        </motion.div>

        {/* Text */}
        <motion.div style={{ opacity: textOpacity, y: textY }} className={textClass}>
          <p className="font-mono text-[10px] tracking-[0.35em] text-reveal sm:text-[11px]">
            {no} — {title.toUpperCase()}
          </p>
          <h2 className="text-legible mt-4 text-[clamp(1.9rem,4.4vw,4rem)] leading-[1.05] font-extralight text-arctic">
            {headline}
          </h2>
          <p className="text-legible mt-4 max-w-md text-sm leading-relaxed text-bone sm:text-base">
            {body}
          </p>
        </motion.div>
      </div>
    </section>
  )
}