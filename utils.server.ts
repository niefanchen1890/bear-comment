import { PrismaClient } from '@prisma/client'
import { UserSession } from './service'
import { getToken } from 'next-auth/jwt'
import * as Sentry from '@sentry/node'
import { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import Boom from '@hapi/boom'

type EnvVariable = string | undefined
const smtpPort = Number(process.env.SMTP_PORT || '587')
const localAuthUsername =
  process.env.CUSDIS_ADMIN_USERNAME ||
  (process.env.PASSWORD ? process.env.USERNAME : undefined)
const localAuthPassword =
  process.env.CUSDIS_ADMIN_PASSWORD || process.env.PASSWORD

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback
  }

  return value.toLowerCase() === 'true'
}

export const resolvedConfig = {
  useLocalAuth: Boolean(localAuthUsername && localAuthPassword),
  localAuth: {
    username: localAuthUsername,
    password: localAuthPassword,
  },
  useGithub: process.env.GITHUB_ID && process.env.GITHUB_SECRET,
  useGitlab: process.env.GITLAB_ID && process.env.GITLAB_SECRET,
  allowedAuthEmails: new Set(
    (process.env.ALLOWED_AUTH_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ),
  jwtSecret: process.env.JWT_SECRET,
  isHosted: process.env.IS_HOSTED === 'true',
  host: process.env.HOST || 'https://cusdis.com',
  checkout: {
    enabled: process.env.CHECKOUT_URL ? true : false,
    url: process.env.CHECKOUT_URL as string,
    lemonSecret: process.env.LEMON_SECRET as string,
    lemonApiKey: process.env.LEMON_API_KEY as string,
  },
  umami: {
    id: process.env.UMAMI_ID as EnvVariable,
    src: process.env.UMAMI_SRC as EnvVariable,
  },
  google: {
    id: process.env.GOOGLE_ID as EnvVariable,
    secret: process.env.GOOGLE_SECRET as EnvVariable,
  },
  smtp: {
    host: process.env.SMTP_HOST as EnvVariable,
    port: smtpPort,
    secure: parseBoolean(process.env.SMTP_SECURE, smtpPort === 465),
    auth: {
      user: process.env.SMTP_USER as EnvVariable,
      pass: process.env.SMTP_PASSWORD as EnvVariable,
    },
    senderAddress:
      (process.env.SMTP_SENDER as EnvVariable) ||
      'Cusdis Notification<notification@cusdis.com>',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY as EnvVariable,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN as EnvVariable,
    chatId: process.env.TELEGRAM_CHAT_ID as EnvVariable,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN as EnvVariable,
  },
}

export const singleton = async <T>(id: string, fn: () => Promise<T>) => {
  if (process.env.NODE_ENV === 'production') {
    return await fn()
  } else {
    if (!global[id]) {
      global[id] = await fn()
    }
    return global[id] as T
  }
}

export const singletonSync = <T>(id: string, fn: () => T) => {
  if (process.env.NODE_ENV === 'production') {
    return fn()
  } else {
    if (!global[id]) {
      global[id] = fn()
    }
    return global[id] as T
  }
}

export const prisma = singletonSync('prisma', () => {
  return new PrismaClient()
})

export const sentry = singletonSync('sentry', () => {
  if (resolvedConfig.sentry.dsn) {
    Sentry.init({
      dsn: resolvedConfig.sentry.dsn,
      tracesSampleRate: 1.0,
    })
    return Sentry
  }
})

export function initMiddleware(middleware) {
  return (req, res) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result)
        }
        return resolve(result)
      })
    })
}

export const HTTPException = Boom
export const apiHandler = () => {
  return nc<NextApiRequest, NextApiResponse>({
    onError(e, req, res, next) {
      if (Boom.isBoom(e)) {
        res.status(e.output.payload.statusCode)
        res.json({
          error: e.output.payload.error,
          message: e.output.payload.message,
        })
      } else {
        res.status(500)
        res.json({
          message: 'Unexpected error',
        })
        console.error(e)
        // unexcepted error
      }
    },
  })
}

export const getSession = async (req) => {
  const token = await getToken({
    req,
    secret: resolvedConfig.jwtSecret,
  })

  if (!token || !(token.id || token.sub)) {
    return null
  }

  const uid = (token.id || token.sub) as string
  if (uid === resolvedConfig.localAuth.username) {
    const credential = await prisma.adminCredential.findUnique({
      where: { username: uid },
      select: { version: true },
    })
    const expectedVersion = credential?.version || 0
    const sessionVersion =
      typeof (token as { adminCredentialVersion?: number }).adminCredentialVersion === 'number'
        ? (token as { adminCredentialVersion: number }).adminCredentialVersion
        : 0

    if (sessionVersion !== expectedVersion) {
      return null
    }
  }

  return {
    user: {
      name: token.name as string,
      email: token.email as string,
    },
    uid,
  } as UserSession
}
