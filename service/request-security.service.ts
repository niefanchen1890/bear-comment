import { NextApiRequest } from 'next'
import Boom from '@hapi/boom'

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function getRequestIp(req: NextApiRequest) {
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = req.headers['x-forwarded-for']
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]
    const realIp = req.headers['x-real-ip']
    const trusted = first || (Array.isArray(realIp) ? realIp[0] : realIp)

    if (trusted) {
      return trusted.trim()
    }
  }

  return req.socket.remoteAddress || 'unknown'
}

function checkRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now()
  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    })
    return { allowed: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1

  if (rateLimitStore.size > 10_000) {
    for (const [storedKey, entry] of rateLimitStore) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(storedKey)
      }
    }
  }

  return {
    allowed: true,
    remaining: limit - current.count,
    retryAfter: 0,
  }
}

export function checkCommentRateLimit(req: NextApiRequest, projectId: string) {
  const limit = positiveInteger(process.env.COMMENT_RATE_LIMIT_MAX, 5)
  const windowSeconds = positiveInteger(
    process.env.COMMENT_RATE_LIMIT_WINDOW_SECONDS,
    60,
  )
  return checkRateLimit(
    `comment:${projectId}:${getRequestIp(req)}`,
    limit,
    windowSeconds,
  )
}

export function checkLoginRateLimit(identifier: string) {
  return checkRateLimit(
    `login:${identifier}`,
    positiveInteger(process.env.LOGIN_RATE_LIMIT_MAX, 10),
    positiveInteger(process.env.LOGIN_RATE_LIMIT_WINDOW_SECONDS, 15 * 60),
  )
}

export function resolveCorsOrigin(origin: string | undefined, callback) {
  if (!origin) {
    callback(null, true)
    return
  }

  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (allowedOrigins.includes(origin)) {
    callback(null, true)
    return
  }

  if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
    callback(null, true)
    return
  }

  callback(Boom.forbidden('Origin is not allowed'))
}
