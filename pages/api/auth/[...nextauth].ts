import NextAuth, { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma, resolvedConfig } from '../../../utils.server'
import { authProviders } from '../../../config.server'
import { statService } from '../../../service/stat.service'

declare module 'next-auth' {
  interface Session {
    uid: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: authProviders,
  adapter: PrismaAdapter(prisma),
  secret: resolvedConfig.jwtSecret,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async session({ session, token }) {
      session.uid = token.id || token.sub
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async signIn({ user, account }) {
      if (
        account?.provider &&
        account.provider !== 'credentials' &&
        (!user.email ||
          !resolvedConfig.allowedAuthEmails.has(user.email.toLowerCase()))
      ) {
        return false
      }

      statService.capture('signIn')
      return true
    },
  },
}

export default NextAuth(authOptions)
