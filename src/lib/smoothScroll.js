import Lenis from 'lenis'

let lenis = null

export function initLenis() {
  if (lenis) return lenis
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.085,
    smoothWheel: !reduce,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.4,
  })
  return lenis
}

export function getLenis() {
  return lenis
}

export function scrollToId(id, options = {}) {
  const el = document.querySelector(id)
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el, {
      duration: 1.8,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      ...options,
    })
  } else {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}