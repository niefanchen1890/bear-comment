import crypto from 'crypto'
import { prisma, resolvedConfig } from '../utils.server'

const SCRYPT_KEY_LENGTH = 64
const SCRYPT_COST = 16_384
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELIZATION = 1
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024

function secretsEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

function deriveKey(password: string, salt: Buffer, cost = SCRYPT_COST) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      {
        N: cost,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
        maxmem: SCRYPT_MAX_MEMORY,
      },
      (error, key) => {
        if (error) {
          reject(error)
          return
        }
        resolve(key)
      },
    )
  })
}

export async function hashAdminPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const key = await deriveKey(password, salt)

  return [
    'scrypt',
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$')
}

export async function verifyAdminPasswordHash(password: string, encoded: string) {
  const [algorithm, costText, blockSizeText, parallelizationText, saltText, keyText] =
    encoded.split('$')
  const cost = Number(costText)
  const blockSize = Number(blockSizeText)
  const parallelization = Number(parallelizationText)

  if (
    algorithm !== 'scrypt' ||
    cost !== SCRYPT_COST ||
    blockSize !== SCRYPT_BLOCK_SIZE ||
    parallelization !== SCRYPT_PARALLELIZATION ||
    !saltText ||
    !keyText
  ) {
    return false
  }

  const expected = Buffer.from(keyText, 'base64')
  if (expected.length !== SCRYPT_KEY_LENGTH) {
    return false
  }

  const actual = await deriveKey(password, Buffer.from(saltText, 'base64'), cost)
  return crypto.timingSafeEqual(actual, expected)
}

export async function verifyLocalAdminCredentials(
  username: string,
  password: string,
) {
  const configuredUsername = resolvedConfig.localAuth.username
  const configuredPassword = resolvedConfig.localAuth.password

  if (!configuredUsername || !configuredPassword) {
    return null
  }

  if (!secretsEqual(username, configuredUsername)) {
    return null
  }

  const credential = await prisma.adminCredential.findUnique({
    where: { username: configuredUsername },
    select: { passwordHash: true, version: true },
  })

  if (credential) {
    return (await verifyAdminPasswordHash(password, credential.passwordHash))
      ? credential.version
      : null
  }

  return secretsEqual(password, configuredPassword) ? 0 : null
}

export async function changeLocalAdminPassword(
  username: string,
  newPassword: string,
) {
  const passwordHash = await hashAdminPassword(newPassword)

  return prisma.adminCredential.upsert({
    where: { username },
    create: {
      username,
      passwordHash,
      version: 1,
    },
    update: {
      passwordHash,
      version: { increment: 1 },
    },
    select: { version: true },
  })
}
