import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import useBarHeight from '../hooks/useBarHeight'
import useActiveChapter from '../hooks/useActiveChapter'
import { getLenis, scrollToId } from '../lib/smoothScroll'
import ChapterMenu from './ChapterMenu'

const EASE = [0.22, 1, 0.36, 1]

export default function Nav({ visible }) {
  const { bar } = useBarHeight()
  const active = useActiveChapter()
  const [open, setOpen] = useState(false)

  // Lock page scroll while the menu is open
  useEffect(() => {
    if (!visible) return
    const lenis = getLenis()
    if (open) lenis?.stop()
    else lenis?.start()
  }, [open, visible])

  // ESC closes the menu
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id) => {
    setOpen(false)
    getLenis()?.start()
    scrollToId(id)
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
        transition={{ duration: 0.9, delay: visible ? 1 : 0, ease: EASE }}
        style={{ height: bar }}
        className="pointer-events-none fixed inset-x-0 top-0 z-[65] flex items-center justify-between px-4 sm:px-8"
      >
        <a
          href="#return"
          onClick={(e) => {
            e.preventDefault()
            go('#return')
          }}
          className="pointer-events-auto flex min-h-11 items-center pl-[0.45em] font-display text-xs font-light tracking-[0.45em] text-arctic uppercase sm:text-sm"
        >
          Roadster
        </a>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-8">
          <a
            href="#reserve"
            onClick={(e) => {
              e.preventDefault()
              go('#reserve')
            }}
            className="group relative hidden min-h-11 items-center font-mono text-[11px] tracking-[0.25em] text-bone transition-colors hover:text-arctic sm:flex"
          >
            RESERVE
            <span className="absolute inset-x-0 bottom-2.5 h-px origin-left scale-x-0 bg-reveal transition-transform duration-500 group-hover:scale-x-100" />
          </a>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="chapter-menu"
            aria-label={open ? 'Close chapters' : 'Open chapters'}
            className="flex min-h-11 min-w-11 items-center justify-center gap-3 font-mono text-[11px] tracking-[0.25em] text-bone transition-colors hover:text-arctic"
          >
            <span className="hidden sm:inline">{open ? 'CLOSE' : 'CHAPTERS'}</span>
            <span className="relative block h-3 w-6">
              <span
                className={`absolute top-0 left-0 h-px w-full bg-arctic transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                  open ? 'translate-y-[5.5px] rotate-45' : ''
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-full bg-arctic transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                  open ? '-translate-y-[5.5px] -rotate-45' : ''
                }`}
              />
            </span>
          </button>
        </div>
      </motion.header>

      <ChapterMenu open={open} activeId={active.id} onNavigate={go} />
    </>
  )
}