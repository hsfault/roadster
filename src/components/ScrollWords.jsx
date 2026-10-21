import { Fragment, useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.2, 1])
  return (
    <motion.span style={{ opacity }} className="inline-block">
      {children}
    </motion.span>
  )
}

// Text that lights up word by word as you scroll through it
export default function ScrollWords({
  text,
  as: Tag = 'p',
  className = '',
  offset = ['start 0.85', 'end 0.5'],
}) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset })
  const words = text.split(' ')

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <Fragment key={i}>
            <Word progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {word}
            </Word>{' '}
          </Fragment>
        ))}
      </span>
    </Tag>
  )
}