const errors = []

function required(name) {
  const value = process.env[name]
  if (!value) {
    errors.push(`${name} is required`)
  }
  return value
}

function validateUrl(name, options = {}) {
  const value = required(name)
  if (!value) return

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && !options.allowLocalHttp) {
      errors.push(`${name} must use https`)
    }
    if (
      url.protocol === 'http:' &&
      options.allowLocalHttp &&
      url.hostname !== 'localhost' &&
      url.hostname !== '127.0.0.1'
    ) {
      errors.push(`${name} must use https outside localhost`)
    }
  } catch {
    errors.push(`${name} must be a valid URL`)
  }
}

const dbType = required('DB_TYPE')
const dbUrl = required('DB_URL')
const jwtSecret = required('JWT_SECRET')

if (dbType && dbType !== 'pgsql') {
  errors.push('DB_TYPE must be pgsql for the supported production deployment')
}

if (dbUrl && !/^postgres(?:ql)?:\/\//.test(dbUrl)) {
  errors.push('DB_URL must be a PostgreSQL connection URL')
}

if (jwtSecret && jwtSecret.length < 32) {
  errors.push('JWT_SECRET must contain at least 32 characters')
}

validateUrl('NEXTAUTH_URL', { allowLocalHttp: true })
validateUrl('HOST', { allowLocalHttp: true })

const modernLocalAuthConfigured = Boolean(
  process.env.CUSDIS_ADMIN_USERNAME || process.env.CUSDIS_ADMIN_PASSWORD,
)
const legacyLocalAuthConfigured = Boolean(process.env.PASSWORD)
const localAuthUsername = modernLocalAuthConfigured
  ? process.env.CUSDIS_ADMIN_USERNAME
  : process.env.USERNAME
const localAuthPassword = modernLocalAuthConfigured
  ? process.env.CUSDIS_ADMIN_PASSWORD
  : process.env.PASSWORD
const localAuth = Boolean(localAuthUsername && localAuthPassword)

if (modernLocalAuthConfigured && !(localAuthUsername && localAuthPassword)) {
  errors.push(
    'CUSDIS_ADMIN_USERNAME and CUSDIS_ADMIN_PASSWORD must be configured together',
  )
}
if (legacyLocalAuthConfigured && !modernLocalAuthConfigured && !process.env.USERNAME) {
  errors.push('USERNAME and PASSWORD must be configured together')
}
if (localAuthPassword && localAuthPassword.length < 12) {
  errors.push('The local administrator password must contain at least 12 characters')
}

const oauthPairs = [
  ['GITHUB_ID', 'GITHUB_SECRET'],
  ['GITLAB_ID', 'GITLAB_SECRET'],
  ['GOOGLE_ID', 'GOOGLE_SECRET'],
]
const oauthEnabled = oauthPairs.some(([id, secret]) => {
  const configured = Boolean(process.env[id] || process.env[secret])
  if (configured && !(process.env[id] && process.env[secret])) {
    errors.push(`${id} and ${secret} must be configured together`)
  }
  return Boolean(process.env[id] && process.env[secret])
})

if (!localAuth && !oauthEnabled) {
  errors.push('Configure local credentials or at least one OAuth provider')
}

if (oauthEnabled && !process.env.ALLOWED_AUTH_EMAILS) {
  errors.push('ALLOWED_AUTH_EMAILS is required when OAuth is enabled')
}

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
const telegramChatId = process.env.TELEGRAM_CHAT_ID
if (Boolean(telegramBotToken) !== Boolean(telegramChatId)) {
  errors.push('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be configured together')
}
if (telegramBotToken && (!telegramBotToken.includes(':') || /\s/.test(telegramBotToken))) {
  errors.push('TELEGRAM_BOT_TOKEN is invalid')
}
if (telegramChatId && (telegramChatId.length > 64 || /\s/.test(telegramChatId))) {
  errors.push('TELEGRAM_CHAT_ID is invalid')
}

const corsOrigins = required('CORS_ORIGINS')
if (corsOrigins) {
  for (const origin of corsOrigins.split(',').map((value) => value.trim())) {
    try {
      const url = new URL(origin)
      if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) {
        errors.push(`CORS_ORIGINS contains an invalid origin: ${origin}`)
      }
    } catch {
      errors.push(`CORS_ORIGINS contains an invalid origin: ${origin}`)
    }
  }
}

if (errors.length > 0) {
  console.error('Invalid Cusdis production configuration:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Cusdis production environment is valid.')
