import crypto from 'node:crypto'

export function createManageToken() {
  return crypto.randomBytes(24).toString('base64url')
}
