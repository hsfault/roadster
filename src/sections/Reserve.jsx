import { useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import Wordmark from '../components/Wordmark'
import { scrollToId } from '../lib/smoothScroll'

const EASE = [0.22, 1, 0.36, 1]

const FINISHES = [
  { id: 'obsidian', name: 'Obsidian', fill: 'radial-gradient(circle at 30% 25%, #3a3a40, #050506 70%)' },
  { id: 'gunmetal', name: 'Gunmetal', fill: 'radial-gradient(circle at 30% 25%, #b4b4bb, #5a5a62 70%)' },
  { id: 'arctic', name: 'Arctic', fill: 'radial-gradient(circle at 30% 25%, #ffffff, #c9c9c4 70%)' },
]

const FOOTER_LINKS = [
  ['The Return', '#return'],
  ['Launch Sequence', '#launch'],
  ['Choose Your Light', '#configure'],
  ['Under the Skin', '#skin'],
]

const SLANT = 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)'

// Two photos at different depths that tilt toward the pointer
function TiltPair() {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 110, damping: 16 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 110, damping: 16 })

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ perspective: 1200 }}
      className="relative mx-auto w-full max-w-2xl"
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative aspect-[1.25/1] w-full"
      >
        {/* Back layer: doors open */}
        <div
          style={{ clipPath: SLANT }}
          className="absolute top-0 left-0 w-[80%] [transform:translateZ(0px)] shadow-2xl"
        >
          <img src="/media/img/tesla-top.png" alt="Roadster with doors open, seen from above" className="w-full" />
        </div>

        {/* Front layer: the face */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-0 bottom-0 w-[76%] [transform:translateZ(90px)]"
        >
          <div style={{ clipPath: SLANT }}>
            <img src="/media/img/tesla-front.png" alt="Roadster front view" className="w-full" />
          </div>
        </motion.div>

        {/* Red light line between the layers */}
        <div className="absolute top-[46%] right-[4%] left-[10%] h-px bg-reveal shadow-[0_0_14px_2px_rgb(227_38_47/0.8)] [transform:translateZ(45px)]" />
      </motion.div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="group relative">
      <label className="font-mono text-[10px] tracking-[0.3em] text-smoke">{label}</label>
      {children}
      <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-reveal transition-transform duration-500 group-focus-within:scale-x-100" />
      {error && <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-reveal">{error}</p>}
    </div>
  )
}

const inputClass =
  'mt-1 block min-h-11 w-full border-b border-white/20 bg-transparent py-3 text-lg font-light text-arctic outline-none placeholder:text-smoke'

export default function Reserve() {
  const [form, setForm] = useState({ name: '', email: '', finish: 'arctic' })
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(null) // reference number once "reserved"

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (form.name.trim().length < 2) next.name = 'ENTER YOUR NAME'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'ENTER A VALID EMAIL'
    setErrors(next)
    if (Object.keys(next).length) return
    setDone(`RDSTR-${Math.floor(100000 + Math.random() * 900000)}`)
  }

  const reset = () => {
    setDone(null)
    setForm({ name: '', email: '', finish: 'arctic' })
  }

  const chosen = FINISHES.find((f) => f.id === form.finish)

  return (
    <section
      id="reserve"
      data-chapter="09"
      className="relative min-h-svh overflow-hidden bg-void px-5 pt-[22svh] pb-[20svh] sm:px-12"
    >
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_60%_50%_at_75%_35%,rgb(227_38_47/0.14),transparent_70%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1fr_1.05fr]">
        {/* Left: copy + form */}
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-mono text-[10px] tracking-[0.35em] text-reveal sm:text-[11px]"
          >
            09 — RESERVE
          </motion.p>

          <motion.div
            initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
            whileInView={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: EASE }}
            className="mt-6 w-[min(80vw,30rem)]"
          >
            <Wordmark className="w-full" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3, ease: EASE }}
            className="text-legible mt-6 max-w-md text-base leading-relaxed font-light text-bone sm:text-lg"
          >
            Nine years in the dark. Put your name on the first light.
          </motion.p>

          <div className="mt-10 min-h-[22rem]">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="max-w-md"
                >
                  <svg viewBox="0 0 52 52" className="h-14 w-14" aria-hidden="true">
                    <motion.circle
                      cx="26"
                      cy="26"
                      r="24"
                      fill="none"
                      stroke="#f2f2ef"
                      strokeWidth="1"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.9, ease: EASE }}
                    />
                    <motion.path
                      d="M15 27 L23 35 L38 18"
                      fill="none"
                      stroke="#e3262f"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
                    />
                  </svg>
                  <h3 className="text-legible mt-6 text-3xl font-extralight tracking-tight text-arctic">
                    You&apos;re on the list.
                  </h3>
                  <p className="mt-4 font-mono text-[11px] tracking-[0.3em] text-bone">
                    REFERENCE <span className="text-reveal">{done}</span>
                  </p>
                  <p className="mt-2 font-mono text-[11px] tracking-[0.3em] text-smoke">
                    FINISH {chosen.name.toUpperCase()}
                  </p>
                  <p className="mt-6 text-sm leading-relaxed text-smoke">
                    This is a concept website. No deposit was taken and nothing was sent.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-6 flex min-h-11 items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-bone transition-colors hover:text-arctic"
                  >
                    RESERVE ANOTHER <ArrowRight size={14} strokeWidth={1.5} />
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={submit}
                  noValidate
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
                  className="max-w-md space-y-8"
                >
                  <Field label="FULL NAME" error={errors.name}>
                    <input
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="EMAIL" error={errors.email}>
                    <input
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </Field>

                  <div>
                    <p className="font-mono text-[10px] tracking-[0.3em] text-smoke">FINISH</p>
                    <div role="radiogroup" aria-label="Paint finish" className="mt-2 flex items-center gap-4">
                      {FINISHES.map((f) => {
                        const active = f.id === form.finish
                        return (
                          <button
                            key={f.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={f.name}
                            onClick={() => setForm({ ...form, finish: f.id })}
                            className="flex min-h-11 min-w-11 items-center justify-center"
                          >
                            <span
                              className={`relative block h-7 w-7 rounded-full ring-1 ring-white/25 ring-inset transition-transform duration-500 ${
                                active ? 'scale-110' : 'scale-90'
                              }`}
                              style={{ background: f.fill }}
                            >
                              <span
                                className={`absolute -inset-[5px] rounded-full border transition-opacity duration-300 ${
                                  active ? 'border-arctic opacity-100' : 'opacity-0'
                                }`}
                              />
                            </span>
                          </button>
                        )
                      })}
                      <span className="ml-2 font-mono text-[11px] tracking-[0.3em] text-bone uppercase">
                        {chosen.name}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-full border border-arctic/60 px-8 font-mono text-[11px] tracking-[0.3em] text-arctic"
                  >
                    <span className="absolute inset-0 translate-y-full bg-arctic transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
                    <span className="relative z-10 flex items-center gap-3 transition-colors duration-500 group-hover:text-void">
                      RESERVE NOW <ArrowRight size={14} strokeWidth={1.5} />
                    </span>
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: tilting 3D photo pair */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
        >
          <TiltPair />
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative mx-auto mt-24 flex max-w-7xl flex-col gap-8 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <Wordmark className="w-28" />
        <nav aria-label="Chapters" className="flex flex-wrap gap-x-6">
          {FOOTER_LINKS.map(([label, id]) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToId(id)}
              className="min-h-11 font-mono text-[10px] tracking-[0.25em] text-smoke uppercase transition-colors hover:text-arctic"
            >
              {label}
            </button>
          ))}
        </nav>
        <p className="max-w-xs font-mono text-[10px] leading-relaxed tracking-[0.15em] text-smoke">
          CONCEPT WEBSITE · NOT AFFILIATED WITH OR ENDORSED BY TESLA
        </p>
      </footer>
    </section>
  )
}