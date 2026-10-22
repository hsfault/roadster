import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { initLenis, getLenis } from './lib/smoothScroll'
import Preloader from './components/Preloader'
import Letterbox from './components/Letterbox'
import Nav from './components/Nav'
import TimecodeHUD from './components/TimecodeHUD'
import ReelChapter from './components/ReelChapter'
import ChapterTransition from './components/ChapterTransition'
import ScrollRail from './components/ScrollRail'
import Hero from './sections/Hero'
import Silhouette from './sections/Silhouette'
import Launch from './sections/Launch'
import Configure from './sections/Configure'
import Skin from './sections/Skin'
import Reserve from './sections/Reserve'

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
      <ScrollRail visible={ready} />
      <ChapterTransition />
      <div className="film-grain" aria-hidden="true" />

      <main className="relative">
        <Hero ready={ready} />
        <Silhouette />

        <ReelChapter
          id="speed"
          no="03"
          title="1.9 Seconds"
          headline="It doesn't just accelerate. It leaves the ground."
          body="Thrusters fire, the car rotates through the air, and it lands back on its wheels."
          src="/media/video/reel-flip.mp4"
          portrait
          textSide="left"
        />

        <ReelChapter
          id="ascension"
          no="04"
          title="Ascension"
          headline="Up the wall. Upside down. Back to the ground."
          body="Suction holds it to the track as it climbs the curve, hangs inverted at the top, then flies free and lands."
          src="/media/video/reel-climb.mp4"
          portrait
          textSide="right"
        />

        <ReelChapter
          id="range"
          no="05"
          title="620 Miles"
          headline="Every surface, drawn to go further."
          body="A slow walk around the whole car, from the wedge nose to the full-width light bar."
          src="/media/video/reel-film.mp4"
        />

        <Launch />
        <Configure />
        <Skin />
        <Reserve />
      </main>
    </>
  )
}