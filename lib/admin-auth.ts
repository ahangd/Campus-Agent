import { createHash, timingSafeEqual } from "node:crypto"

export const ADMIN_SESSION_COOKIE = "campusmind-admin-session"

function toBuffer(value: string) {
  return Buffer.from(value, "utf8")
}

export function verifyAdminPassword(input: string, expected: string) {
  const normalizedInput = input.trim()
  const normalizedExpected = expected.trim()

  if (!normalizedInput || !normalizedExpected) {
    return false
  }

  const inputBuffer = toBuffer(normalizedInput)
  const expectedBuffer = toBuffer(normalizedExpected)

  if (inputBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(inputBuffer, expectedBuffer)
}

export function createAdminSessionToken(password: string) {
  return createHash("sha256").update(`campusmind-admin:${password.trim()}`).digest("hex")
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || ""
}

export function hasAdminSessionValue(cookieValue?: string | null) {
  const password = getAdminPassword()
  if (!password || !cookieValue) {
    return false
  }

  return cookieValue === createAdminSessionToken(password)
}
