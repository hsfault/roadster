import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { initLenis, getLenis } from './lib/smoothScroll'
import Preloader from './components/Preloader'
import Letterbox from './components/Letterbox'
import Nav from './components/Nav'
import TimecodeHUD from './components/TimecodeHUD'
import Hero from './sections/Hero'
import Silhouette from './sections/Silhouette'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const lenis = initLenis()
    if (!ready) {
      lenis.stop()
      document.documentElement.style.overflow = 'hidden'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDone = useCallback(() => {
    setReady(true)
    document.documentElement.style.overflow = ''
    getLenis()?.start()
  }, [])

  return (
    <>
      <AnimatePresence>
        {!ready && <Preloader key="preloader" onDone={handleDone} />}
      </AnimatePresence>

      <Letterbox open={ready} />
      <Nav visible={ready} />
      <TimecodeHUD visible={ready} />
      <div className="film-grain" aria-hidden="true" />

      <main className="relative">
        <Hero ready={ready} />
        <Silhouette />

        {/* Temporary — replaced in Phase 3 */}
        <section
          id="speed"
          data-chapter="03"
          className="grid min-h-svh place-items-center bg-void px-6 text-center"
        >
          <div>
            <p className="font-mono text-[11px] tracking-[0.35em] text-reveal">03 — 1.9 SECONDS</p>
            <p className="mt-4 text-2xl font-light text-bone sm:text-4xl">
              Chapter three arrives in Phase 3.
            </p>
          </div>
        </section>
      </main>
    </>
  )
}