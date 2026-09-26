import dns from 'dns'
import http from 'http'
import https from 'https'
import net from 'net'

function isPrivateIpv4(address: string) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return true
  }

  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function isPrivateIp(address: string) {
  const family = net.isIP(address)
  if (family === 4) {
    return isPrivateIpv4(address)
  }

  if (family !== 6) {
    return true
  }

  const normalized = address.toLowerCase()
  if (normalized.startsWith('::ffff:')) {
    return isPrivateIpv4(normalized.slice(7))
  }

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized)
  )
}

export function parseWebhookUrl(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Webhook URL is invalid')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Webhook URL must use http or https')
  }

  if (url.username || url.password) {
    throw new Error('Webhook URL must not contain credentials')
  }

  return url
}

export async function assertSafeWebhookUrl(value: string) {
  const url = parseWebhookUrl(value)
  const addresses = await dns.promises.lookup(url.hostname, {
    all: true,
    verbatim: true,
  })

  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error('Webhook URL resolves to a private or reserved address')
  }

  return url.toString()
}

function safeLookup(hostname, options, callback) {
  dns.lookup(hostname, options, (error, address, family) => {
    if (error) {
      callback(error, address, family)
      return
    }

    // Node 22 may request all DNS results from an Agent lookup. Preserve that
    // callback shape and reject the destination if any returned address is
    // private, so DNS rebinding protection remains fail-closed.
    if (Array.isArray(address)) {
      if (
        address.length === 0 ||
        address.some((result) => isPrivateIp(result.address))
      ) {
        callback(new Error('Webhook destination is private or reserved'))
        return
      }

      callback(null, address)
      return
    }

    if (isPrivateIp(address)) {
      callback(new Error('Webhook destination is private or reserved'), address, family)
      return
    }

    callback(null, address, family)
  })
}

// Keep this callback at connection time so DNS rebinding cannot bypass the
// validation above. Node's overloaded DNS callback types require the cast.
export const safeHttpAgent = new http.Agent({ lookup: safeLookup } as any)
export const safeHttpsAgent = new https.Agent({ lookup: safeLookup } as any)
