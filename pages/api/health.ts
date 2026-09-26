import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../utils.server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ status: 'method_not_allowed' })
    return
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ status: 'ok' })
  } catch {
    res.status(503).json({ status: 'unavailable' })
  }
}
