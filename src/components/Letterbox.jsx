import { motion } from 'motion/react'
import useBarHeight from '../hooks/useBarHeight'

const EASE = [0.76, 0, 0.24, 1]

// Two black cinema bars. Closed = they meet in the middle. Open = 2.39:1 frame.
export default function Letterbox({ open }) {
  const { bar, vh } = useBarHeight()
  const closed = vh / 2 / bar + 0.02
  const transition = { duration: 1.6, ease: EASE, delay: open ? 0.15 : 0 }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40">
      <motion.div
        initial={{ scaleY: closed }}
        animate={{ scaleY: open ? 1 : closed }}
        transition={transition}
        style={{ height: bar }}
        className="absolute inset-x-0 top-0 origin-top bg-black"
      />
      <motion.div
        initial={{ scaleY: closed }}
        animate={{ scaleY: open ? 1 : closed }}
        transition={transition}
        style={{ height: bar }}
        className="absolute inset-x-0 bottom-0 origin-bottom bg-black"
      />
    </div>
  )
}