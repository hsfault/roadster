import { frameUrl } from './media'

// One shared cache, so the preloader and the canvas use the same images
const cache = new Map()

export function loadSequence({ folder, count }) {
  if (cache.has(folder)) return cache.get(folder)

  const entry = {
    images: new Array(count),
    count,
    loaded: 0,
    listeners: new Set(),
    done: null,
  }

  entry.done = new Promise((resolve) => {
    let settled = 0

    for (let i = 0; i < count; i++) {
      const img = new Image()
      img.decoding = 'async'

      const finish = (ok) => {
        if (ok) entry.images[i] = img
        settled += 1
        entry.loaded = settled
        entry.listeners.forEach((fn) => fn(settled / count))
        if (settled === count) resolve(entry)
      }

      img.onload = () => {
        // Pre-decode only the first frame so the very first draw is instant
        if (i === 0 && img.decode) img.decode().catch(() => {}).finally(() => finish(true))
        else finish(true)
      }
      img.onerror = () => finish(false)
      img.src = frameUrl(folder, i)
    }
  })

  cache.set(folder, entry)
  return entry
}

export function onSequenceProgress(entry, fn) {
  entry.listeners.add(fn)
  fn(entry.loaded / entry.count)
  return () => entry.listeners.delete(fn)
}