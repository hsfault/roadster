import { AnimatePresence, motion } from 'motion/react'
import { CHAPTERS } from '../lib/chapters'

const EASE = [0.22, 1, 0.36, 1]

export default function ChapterMenu({ open, activeId, onNavigate }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="chapter-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Chapters"
          data-lenis-prevent
          initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(100% 0% 0% 0%)' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-void"
        >
          <div className="mx-auto flex min-h-full max-w-6xl flex-col justify-center px-4 py-24 sm:px-8 sm:py-28">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="font-mono text-[10px] tracking-[0.35em] text-smoke sm:text-[11px]"
            >
              SELECT A CHAPTER
            </motion.p>

            <ol className="mt-6 border-t border-white/10">
              {CHAPTERS.map((c, i) => {
                const isActive = c.id === activeId
                return (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.7, ease: EASE }}
                    className="border-b border-white/10"
                  >
                    <a
                      href={`#${c.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        onNavigate(`#${c.id}`)
                      }}
                      className="group relative flex min-h-14 items-baseline gap-4 py-4 sm:gap-8 sm:py-5"
                    >
                      <span className="w-7 shrink-0 font-mono text-[11px] tracking-[0.2em] text-smoke">
                        {c.no}
                      </span>
                      <span
                        className={`flex-1 text-2xl font-light tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 sm:text-5xl ${
                          isActive ? 'text-arctic' : 'text-bone/80 group-hover:text-arctic'
                        }`}
                      >
                        {c.title}
                      </span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 shrink-0 self-center rounded-full bg-reveal" />
                      )}
                      <span className="hidden font-mono text-[11px] tracking-[0.2em] text-smoke sm:inline">
                        {c.tc}
                      </span>
                      <span className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-reveal transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
                    </a>
                  </motion.li>
                )
              })}
            </ol>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-8 hidden font-mono text-[10px] tracking-[0.35em] text-smoke sm:block"
            >
              ESC TO CLOSE
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}