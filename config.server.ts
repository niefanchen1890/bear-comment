import { Provider } from 'next-auth/providers'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GitLabProvider from 'next-auth/providers/gitlab'
import GoogleProvider from 'next-auth/providers/google'
import crypto from 'crypto'
import { prisma, resolvedConfig } from './utils.server'
import { checkLoginRateLimit } from './service/request-security.service'

const providers: Provider[] = []

function secretsEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

if (resolvedConfig.useLocalAuth) {
  providers.push(
    CredentialsProvider({
      name: 'Bear Comment 管理員',
      credentials: {
        username: {
          label: '使用者名稱',
          type: 'text',
          placeholder: 'env: CUSDIS_ADMIN_USERNAME',
        },
        password: {
          label: '密碼',
          type: 'password',
          placeholder: 'env: CUSDIS_ADMIN_PASSWORD',
        },
      },
      async authorize(credentials, request) {
        const forwarded =
          process.env.TRUST_PROXY === 'true'
            ? request.headers?.['x-forwarded-for']
            : undefined
        const forwardedIp = Array.isArray(forwarded)
          ? forwarded[0]
          : forwarded?.split(',')[0]
        const remoteIp = (request as any).socket?.remoteAddress
        const loginRateLimit = checkLoginRateLimit(
          (forwardedIp || remoteIp || 'unknown').trim(),
        )

        if (!loginRateLimit.allowed) {
          return null
        }

        if (
          credentials?.username &&
          credentials?.password &&
          resolvedConfig.localAuth.username &&
          resolvedConfig.localAuth.password &&
          secretsEqual(credentials.username, resolvedConfig.localAuth.username) &&
          secretsEqual(credentials.password, resolvedConfig.localAuth.password)
        ) {
          return prisma.user.upsert({
            where: {
              id: credentials.username,
            },
            create: {
              id: credentials.username,
              name: credentials.username,
            },
            update: {
              name: credentials.username,
            },
          })
        }

        return null
      },
    }),
  )
}

if (resolvedConfig.useGithub) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  )
}

if (resolvedConfig.useGitlab) {
  providers.push(
    GitLabProvider({
      clientId: process.env.GITLAB_ID,
      clientSecret: process.env.GITLAB_SECRET,
    }),
  )
}

if (resolvedConfig.google.id && resolvedConfig.google.secret) {
  providers.push(
    GoogleProvider({
      clientId: resolvedConfig.google.id,
      clientSecret: resolvedConfig.google.secret,
    }),
  )
}

export const authProviders = providers
