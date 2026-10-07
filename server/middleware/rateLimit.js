const attempts = new Map()

export function submissionRateLimit(req, res, next) {
  const key = `${req.ip}:${req.params.slug}`
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || now - current.startedAt > 60_000) {
    if (attempts.size > 5000) {
      for (const [attemptKey, attempt] of attempts.entries()) {
        if (now - attempt.startedAt > 60_000) attempts.delete(attemptKey)
      }
    }
    attempts.set(key, { startedAt: now, count: 1 })
    return next()
  }
  if (current.count >= 10) return res.status(429).json({ message: 'Too many submissions. Please try again in a minute.' })
  current.count += 1
  return next()
}
