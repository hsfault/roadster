import { useEffect, useState } from 'react'
import { CHAPTERS } from '../lib/chapters'

// Tracks which chapter section crosses the middle of the screen
export default function useActiveChapter() {
  const [active, setActive] = useState(CHAPTERS[0])

  useEffect(() => {
    const els = CHAPTERS.map((c) => document.getElementById(c.id)).filter(Boolean)
    if (!els.length) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const chapter = CHAPTERS.find((c) => c.id === entry.target.id)
          if (chapter) setActive(chapter)
        })
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )

    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return active
}