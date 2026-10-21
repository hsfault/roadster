import { useRef } from 'react'
import { easeInOut, motion, useScroll, useTransform } from 'motion/react'

const IMG = {
  photo: '/media/img/paint-white.webp',
  blueprint: '/media/img/blueprint.webp',
  light: '/media/img/detail-light.webp',
  wheel: '/media/img/detail-wheel.webp',
  rear: '/media/img/detail-rear.webp',
}

const TITLE = 'Drawn with a ruler. Finished with light.'.split(' ')

// Camera path across the side profile. x / y = focus point (% of the image), z = zoom.
// Nudge x / y if the camera doesn't land exactly on the nose, front wheel or tail.
const CAM = {
  at: [0, 0.28, 0.38, 0.56, 0.64, 0.78, 0.86, 1],
  x: [50, 50, 12, 12, 29, 29, 88, 88],
  y: [50, 50, 60, 60, 70, 70, 56, 56],
  z: [1, 1, 2.2, 2.2, 2.4, 2.4, 2.2, 2.2],
}

// Wheel centres on the side-profile image (blueprint axle circles)
const AXLES = [29, 76]
const AXLE_Y = 71

const STEPS = [
  { label: 'PROFILE', range: [0.05, 0.3] },
  { label: 'FACE', range: [0.3, 0.56] },
  { label: 'WHEELS', range: [0.56, 0.8] },
  { label: 'TAIL', range: [0.8, 0.98] },
]

const pct = (n) => String(Math.round(n)).padStart(3, '0')

function TitleWord({ word, i, total, progress }) {
  const start = 0.45 + (i / total) * 0.4
  const opacity = useTransform(progress, [start, start + 0.15], [0, 1])
  const y = useTransform(progress, [start, start + 0.15], ['70%', '0%'])
  return (
    <span className="inline-block overflow-hidden pb-[0.1em] align-bottom">
      <motion.span style={{ opacity, y }} className="inline-block">
        {word}
      </motion.span>
    </span>
  )
}

function DetailLayer({ src, alt, p, range, out = [0, 1, 1, 0], focus = 'center', children }) {
  const opacity = useTransform(p, range, out)
  const scale = useTransform(p, [range[0], range[3]], [1.16, 1])
  return (
    <motion.div style={{ opacity }} className="absolute inset-0 overflow-hidden">
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ scale, objectPosition: focus }}
        className="h-full w-full object-cover"
      />
      {children}
    </motion.div>
  )
}

// Light glint that slides across the headlight close-up
function Sheen({ p, range }) {
  const x = useTransform(p, range, ['-100%', '100%'])
  return (
    <motion.div
      style={{ x }}
      className="pointer-events-none absolute inset-0 [background:linear-gradient(105deg,transparent_38%,rgb(255_255_255/0.22)_50%,transparent_62%)]"
    />
  )
}

function Caption({ p, range, kicker, title, text, className = '' }) {
  const opacity = useTransform(p, range, [0, 1, 1, 0])
  const titleY = useTransform(p, [range[0], range[1]], ['100%', '0%'])
  const line = useTransform(p, [range[0], range[1]], [0, 1])
  return (
    <motion.div style={{ opacity }} className={`pointer-events-none absolute max-w-md ${className}`}>
      <div className="flex items-center gap-3">
        <motion.span style={{ scaleX: line }} className="block h-px w-8 origin-left bg-reveal" />
        <p className="font-mono text-[10px] tracking-[0.35em] text-reveal sm:text-[11px]">{kicker}</p>
      </div>
      <div className="mt-4 overflow-hidden pb-1">
        <motion.h3
          style={{ y: titleY }}
          className="text-legible text-3xl font-medium tracking-tight text-arctic sm:text-5xl"
        >
          {title}
        </motion.h3>
      </div>
      <p className="text-legible mt-4 text-sm leading-relaxed font-light text-bone sm:text-base">{text}</p>
    </motion.div>
  )
}

function RailStep({ step, i, p }) {
  const fill = useTransform(p, step.range, [0, 1])
  const label = useTransform(
    p,
    [step.range[0] - 0.02, step.range[0], step.range[1], step.range[1] + 0.02],
    [0.35, 1, 1, 0.35]
  )
  return (
    <li className="flex items-center gap-3 md:flex-row-reverse">
      <span className="relative block h-px w-10 overflow-hidden bg-white/15 md:h-12 md:w-px">
        <motion.span style={{ scaleX: fill }} className="absolute inset-0 origin-left bg-reveal md:hidden" />
        <motion.span style={{ scaleY: fill }} className="absolute inset-0 hidden origin-top bg-reveal md:block" />
      </span>
      <motion.span
        style={{ opacity: label }}
        className="hidden font-mono text-[10px] tracking-[0.3em] text-arctic md:inline"
      >
        0{i + 1} {step.label}
      </motion.span>
    </li>
  )
}

export default function Silhouette() {
  const ref = useRef(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ['start end', 'start start'] })

  // Camera
  const fx = useTransform(p, CAM.at, CAM.x, { ease: easeInOut })
  const fy = useTransform(p, CAM.at, CAM.y, { ease: easeInOut })
  const zoom = useTransform(p, CAM.at, CAM.z, { ease: easeInOut })
  const camX = useTransform([fx, zoom], ([x, z]) => `${(50 - x) * z}%`)
  const camY = useTransform([fy, zoom], ([y, z]) => `${(50 - y) * z}%`)

  // Blueprint + scan
  const blueprintOpacity = useTransform(enter, [0.3, 1], [0, 1])
  const dims = useTransform(enter, [0.55, 1], [0, 1])
  const dimsOpacity = useTransform(p, [0.24, 0.3], [1, 0])
  const scan = useTransform(p, [0.05, 0.24], [0, 100], { ease: easeInOut })
  const photoClip = useTransform(scan, (s) => `inset(0 ${100 - s}% 0 0)`)
  const beamLeft = useTransform(scan, (s) => `${s}%`)
  const beamOpacity = useTransform(p, [0.04, 0.06, 0.23, 0.25], [0, 1, 1, 0])
  const scanText = useTransform(scan, (s) => `SCAN ${pct(s)}%`)
  const gridIn = useTransform(enter, [0.3, 1], [0, 1])
  const gridOut = useTransform(p, [0.28, 0.36], [1, 0])
  const gridOpacity = useTransform([gridIn, gridOut], ([a, b]) => a * b)

  // Title, scrims, rail, ending
  const titleOpacity = useTransform(p, [0.03, 0.09], [1, 0])
  const titleY = useTransform(p, [0.03, 0.09], [0, -40])
  const detailsOn = useTransform(p, [0.34, 0.4], [0, 1])
  const railOpacity = useTransform(p, [0, 0.04, 0.96, 1], [0, 1, 1, 0])
  const blackout = useTransform(p, [0.97, 1], [0, 1])

  return (
    <section id="silhouette" data-chapter="02" ref={ref} className="relative h-[700svh] bg-void">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Blueprint grid */}
        <motion.div style={{ opacity: gridOpacity }} className="blueprint-grid absolute inset-0" />

        {/* Camera rig: blueprint + real photo + scan beam */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            style={{ x: camX, y: camY, scale: zoom }}
            className="relative aspect-video w-full max-md:[mask-image:radial-gradient(ellipse_75%_70%_at_50%_50%,black_60%,transparent_100%)]"
          >
            <motion.img
              src={IMG.blueprint}
              alt=""
              aria-hidden="true"
              style={{ opacity: blueprintOpacity }}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <motion.img
              src={IMG.photo}
              alt="Side profile of the white Roadster"
              style={{ clipPath: photoClip }}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Blueprint dimension lines */}
            <motion.div style={{ opacity: dimsOpacity }} className="pointer-events-none absolute inset-0">
              <motion.div style={{ scaleX: dims }} className="absolute top-[86%] left-[7%] h-px w-[84%] origin-left bg-cryo/70" />
              <motion.span style={{ opacity: dims }} className="absolute top-[84.5%] left-[7%] h-[3%] w-px bg-cryo/70" />
              <motion.span style={{ opacity: dims }} className="absolute top-[84.5%] left-[91%] h-[3%] w-px bg-cryo/70" />
              <motion.span
                style={{ opacity: dims }}
                className="absolute top-[88%] left-1/2 -translate-x-1/2 font-mono text-[7px] tracking-[0.3em] text-cryo sm:text-[10px]"
              >
                OVERALL LENGTH
              </motion.span>

              <motion.div style={{ scaleY: dims }} className="absolute top-[33%] left-[95%] h-[46%] w-px origin-bottom bg-cryo/70" />
              <motion.span
                style={{ opacity: dims }}
                className="absolute top-[50%] left-[96.2%] font-mono text-[7px] tracking-[0.3em] text-cryo [writing-mode:vertical-rl] sm:text-[10px]"
              >
                HEIGHT
              </motion.span>

              {AXLES.map((x, i) => (
                <div key={x}>
                  <motion.div
                    style={{ left: `${x}%`, scaleY: dims }}
                    className="absolute top-[18%] h-[72%] origin-bottom border-l border-dashed border-cryo/30"
                  />
                  <motion.div
                    style={{ left: `${x}%`, top: `${AXLE_Y}%`, scale: dims }}
                    className="absolute aspect-square w-[15%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cryo/60"
                  />
                  <motion.span
                    style={{ left: `${x}%`, opacity: dims }}
                    className="absolute top-[14%] -translate-x-1/2 font-mono text-[7px] tracking-[0.3em] text-cryo sm:text-[10px]"
                  >
                    AXLE 0{i + 1}
                  </motion.span>
                </div>
              ))}
            </motion.div>

            {/* Scan beam */}
            <motion.div
              style={{ left: beamLeft, opacity: beamOpacity }}
              className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-arctic shadow-[0_0_18px_3px_rgb(168_220_255/0.8)]"
            >
              <div className="absolute inset-y-0 right-0 w-24 bg-linear-to-l from-cryo/25 to-transparent" />
            </motion.div>
            <motion.span
              style={{ left: beamLeft, opacity: beamOpacity }}
              className="pointer-events-none absolute top-[6%] ml-3 font-mono text-[8px] tracking-[0.3em] whitespace-nowrap text-cryo sm:text-[10px]"
            >
              {scanText}
            </motion.span>
          </motion.div>
        </div>

        {/* Close-ups the camera dissolves into */}
        <DetailLayer src={IMG.light} alt="Headlight and light blade close-up" p={p} range={[0.36, 0.42, 0.55, 0.59]} focus="45% 40%">
          <Sheen p={p} range={[0.42, 0.56]} />
        </DetailLayer>
        <DetailLayer src={IMG.wheel} alt="Wheel with turbine aero cover close-up" p={p} range={[0.62, 0.68, 0.78, 0.82]} focus="48% 58%" />
        <DetailLayer src={IMG.rear} alt="Rear light bar and four nozzles close-up" p={p} range={[0.84, 0.9, 0.99, 1]} out={[0, 1, 1, 1]} focus="50% 45%">
          <div className="pointer-events-none absolute inset-0 animate-pulse [background:radial-gradient(ellipse_at_50%_38%,rgb(227_38_47/0.22),transparent_45%)]" />
        </DetailLayer>

        {/* Readability scrims */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[35%] bg-linear-to-b from-void/85 to-transparent" />
        <motion.div
          style={{ opacity: detailsOn }}
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[60%] bg-linear-to-r from-void/90 via-void/50 to-transparent sm:block"
        />
        <motion.div
          style={{ opacity: detailsOn }}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-t from-void via-void/70 to-transparent"
        />
        <motion.div style={{ opacity: blackout }} className="pointer-events-none absolute inset-0 bg-void" />

        {/* Chapter title */}
        <motion.div
          style={{ opacity: titleOpacity, y: titleY }}
          className="absolute inset-x-0 top-[14%] px-5 text-center sm:top-[13%]"
        >
          <p className="font-mono text-[10px] tracking-[0.35em] text-reveal sm:text-[11px]">02 — SILHOUETTE</p>
          <h2 className="text-legible mx-auto mt-5 max-w-4xl text-3xl leading-[1.08] font-medium tracking-tight text-arctic sm:text-6xl">
            {TITLE.map((word, i) => (
              <span key={i}>
                <TitleWord word={word} i={i} total={TITLE.length} progress={enter} />{' '}
              </span>
            ))}
          </h2>
        </motion.div>

        {/* Captions */}
        <Caption
          p={p}
          range={[0.18, 0.22, 0.28, 0.31]}
          kicker="02.1 — PROFILE"
          title="One continuous wedge"
          text="From the sharp nose to the cut-off tail, the roofline is a single, unbroken stroke."
          className="top-[16%] right-5 left-5 sm:top-[13%] sm:right-auto sm:left-12"
        />
        <Caption
          p={p}
          range={[0.42, 0.46, 0.54, 0.57]}
          kicker="02.2 — THE FACE"
          title="A blade of light"
          text="One LED line across the nose, two sharp triangles at the corners. Nothing else."
          className="right-5 bottom-[14%] left-5 sm:right-auto sm:bottom-[16%] sm:left-12"
        />
        <Caption
          p={p}
          range={[0.66, 0.7, 0.77, 0.8]}
          kicker="02.3 — THE WHEELS"
          title="Turbine aero covers"
          text="Flat white blades over black wheels, cut to calm the air before it reaches the body."
          className="right-5 bottom-[14%] left-5 sm:right-auto sm:bottom-[16%] sm:left-12"
        />
        <Caption
          p={p}
          range={[0.88, 0.92, 0.97, 1]}
          kicker="02.4 — THE TAIL"
          title="The business end"
          text="A full-width red light bar above four round nozzles — the visual promise of the rumored thruster package."
          className="right-5 bottom-[14%] left-5 sm:right-auto sm:bottom-[16%] sm:left-12"
        />

        {/* Step rail */}
        <motion.ol
          style={{ opacity: railOpacity }}
          className="absolute inset-x-0 top-[76px] flex justify-center gap-2 md:inset-x-auto md:top-1/2 md:right-10 md:-translate-y-1/2 md:flex-col md:items-end md:gap-3"
        >
          {STEPS.map((step, i) => (
            <RailStep key={step.label} step={step} i={i} p={p} />
          ))}
        </motion.ol>
      </div>
    </section>
  )
}