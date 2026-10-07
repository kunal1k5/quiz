import crypto from 'node:crypto'

export function createSlug() {
  return crypto.randomBytes(5).toString('base64url').slice(0, 7)
}

export function isValidSlug(slug) {
  return typeof slug === 'string' && /^[A-Za-z0-9_-]{6,7}$/.test(slug)
}
