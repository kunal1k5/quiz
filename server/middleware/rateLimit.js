const attempts = new Map()
const likeAttempts = new Map()

function allowAttempt(store, key, limit, message, req, res, next) {
  const now = Date.now()
  const current = store.get(key)
  if (!current || now - current.startedAt > 60_000) {
    if (store.size > 5000) {
      for (const [attemptKey, attempt] of store.entries()) {
        if (now - attempt.startedAt > 60_000) store.delete(attemptKey)
      }
    }
    store.set(key, { startedAt: now, count: 1 })
    return next()
  }
  if (current.count >= limit) return res.status(429).json({ message })
  current.count += 1
  return next()
}

export function submissionRateLimit(req, res, next) {
  return allowAttempt(
    attempts,
    `${req.ip}:${req.params.slug}`,
    10,
    'Too many submissions. Please try again in a minute.',
    req,
    res,
    next,
  )
}

export function likeRateLimit(req, res, next) {
  return allowAttempt(
    likeAttempts,
    `${req.ip}:${req.params.slug}:${req.get('x-client-id')}`,
    10,
    'Too many like attempts. Please try again in a minute.',
    req,
    res,
    next,
  )
}
