// The ROADSTER logo, cropped to the text only (the PNG has lots of empty space).
// Crop values are for roadster-wordmark.png: 642x37 text area at x=75, y=121 inside a 784x250 image.
// Size it with a width class, e.g. <Wordmark className="w-32" />
export default function Wordmark({ className = '', label = 'Roadster' }) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`relative block overflow-hidden ${className}`}
      style={{ aspectRatio: '642 / 37' }}
    >
      <img
        src="/media/img/roadster-wordmark.png"
        alt=""
        draggable="false"
        className="absolute max-w-none select-none drop-shadow-[0_4px_30px_rgb(0_0_0/0.65)]"
        style={{
          width: `${(784 / 642) * 100}%`,
          height: 'auto',
          left: `${-(75 / 642) * 100}%`,
          top: `${-(121 / 37) * 100}%`,
        }}
      />
    </span>
  )
}