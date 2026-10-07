import { motion, useReducedMotion } from 'framer-motion'
import { STICKER_SPRITE, stickerSets } from '../assets/quizlyAssets'
import { duduBubuAssets } from '../config/duduBubuAssets'

const teddySizes = {
  xs: 'h-8 w-8',
  sm: 'h-12 w-12',
  md: 'h-20 w-20',
  lg: 'h-24 w-24',
  hero: 'h-28 w-28 sm:h-36 sm:w-36',
}

const stateAssets = {
  home: 'hero',
  waving: 'friendship',
  love: 'friendship',
  writing: 'thinkingLaptop',
  loading: 'thinking',
  thinking: 'thinking',
  happy: 'happy',
  celebrating: 'happy',
  sad: 'sad',
  sleeping: 'sad',
  confused: 'sad',
  '404': 'sad',
}

export function TeddyArt({ state = 'home', size = 'md', label, decorative = false, className = '' }) {
  const reduceMotion = useReducedMotion()
  const aria = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label || `${state} teddy` }
  const source = duduBubuAssets[stateAssets[state] || 'thinking']

  return (
    <motion.img
      {...aria}
      src={source}
      alt={decorative ? '' : label || `${state} Dudu Bubu illustration`}
      onError={event => {
        if (event.currentTarget.src.endsWith(duduBubuAssets.fallback)) {
          event.currentTarget.style.display = 'none'
          return
        }
        event.currentTarget.src = duduBubuAssets.fallback
      }}
      className={`teddy-art shrink-0 ${teddySizes[size] || teddySizes.md} ${className}`}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      role={decorative ? undefined : 'img'}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    />
  )
}

export function Sticker({ name, className = '' }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.svg
      aria-hidden="true"
      className={`sticker-art absolute ${className}`}
      viewBox="0 0 80 80"
      animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <use href={`${STICKER_SPRITE}#sticker-${name}`} />
    </motion.svg>
  )
}

export function StickerLayer({ variant = 'home' }) {
  const stickers = stickerSets[variant] || []
  if (!stickers.length) return null

  return (
    <div className="sticker-layer pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {stickers.map(sticker => (
        <Sticker key={`${sticker.name}-${sticker.className}`} name={sticker.name} className={sticker.className} />
      ))}
    </div>
  )
}

export function TeddyMessage({ state = 'home', children, className = '' }) {
  return (
    <div className={`teddy-message ${className}`}>
      <TeddyArt state={state} size="sm" />
      <p>{children}</p>
    </div>
  )
}
