// Frame-sequence folders inside public/media/seq/
export const SEQUENCES = {
  hero: {
    landscape: { folder: 'hero', count: 120 },
    portrait: { folder: 'hero-m', count: 60 },
  },
  doors: {
    landscape: { folder: 'doors', count: 96 },
    portrait: { folder: 'doors-m', count: 48 },
  },
  launch: {
    landscape: { folder: 'launch', count: 120 },
    portrait: { folder: 'launch-m', count: 60 },
  },
}

// Phones and portrait tablets use the vertical / lighter sequences
export const PORTRAIT_QUERY = '(orientation: portrait) and (max-width: 1024px)'

export function getOrientation() {
  if (typeof window === 'undefined') return 'landscape'
  return window.matchMedia(PORTRAIT_QUERY).matches ? 'portrait' : 'landscape'
}

export function frameUrl(folder, index) {
  return `/media/seq/${folder}/${String(index + 1).padStart(4, '0')}.webp`
}