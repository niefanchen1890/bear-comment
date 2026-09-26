import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '../../../service/auth.service'
import {
  changeLocalAdminPassword,
  verifyLocalAdminCredentials,
} from '../../../service/admin-credential.service'
import {
  checkLoginRateLimit,
  getRequestIp,
} from '../../../service/request-security.service'
import { resolvedConfig } from '../../../utils.server'

function requestHasValidOrigin(req: NextApiRequest) {
  const origin = req.headers.origin
  if (!origin) {
    return process.env.NODE_ENV !== 'production'
  }

  const forwardedHost = req.headers['x-forwarded-host']
  const host =
    process.env.TRUST_PROXY === 'true' && forwardedHost
      ? Array.isArray(forwardedHost)
        ? forwardedHost[0]
        : forwardedHost.split(',')[0]
      : req.headers.host
  const forwardedProto = req.headers['x-forwarded-proto']
  const protocol =
    process.env.TRUST_PROXY === 'true' && forwardedProto
      ? Array.isArray(forwardedProto)
        ? forwardedProto[0]
        : forwardedProto.split(',')[0]
      : (req.socket as any).encrypted
        ? 'https'
        : 'http'
  const allowedOrigins = new Set<string>()

  if (host) {
    allowedOrigins.add(`${protocol.trim()}://${host.trim()}`)
  }
  try {
    allowedOrigins.add(new URL(resolvedConfig.host).origin)
  } catch (_) {
    // HOST validation reports malformed production configuration at startup.
  }

  return allowedOrigins.has(origin)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ message: '不支援此請求方法' })
    return
  }

  if (
    !req.headers['content-type']?.toLowerCase().startsWith('application/json') ||
    !requestHasValidOrigin(req)
  ) {
    res.status(403).json({ message: '請求來源無效' })
    return
  }

  const authService = new AuthService(req, res)
  const session = await authService.authGuard()
  if (!session) {
    return
  }

  const username = resolvedConfig.localAuth.username
  if (!resolvedConfig.useLocalAuth || !username || session.uid !== username) {
    res.status(403).json({ message: '此帳號不支援修改本地密碼' })
    return
  }

  const currentPassword = req.body?.currentPassword
  const newPassword = req.body?.newPassword

  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    newPassword.length < 12 ||
    newPassword.length > 128
  ) {
    res.status(400).json({ message: '新密碼必須為 12 至 128 個字元' })
    return
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ message: '新密碼不能與現有密碼相同' })
    return
  }

  const rateLimit = checkLoginRateLimit(`password-change:${getRequestIp(req)}`)
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', rateLimit.retryAfter.toString())
    res.status(429).json({ message: '嘗試次數過多，請稍後再試' })
    return
  }

  const credentialVersion = await verifyLocalAdminCredentials(
    username,
    currentPassword,
  )
  if (credentialVersion === null) {
    res.status(401).json({ message: '現有密碼不正確' })
    return
  }

  await changeLocalAdminPassword(username, newPassword)
  res.status(200).json({ message: '密碼已更新，請重新登入' })
}
