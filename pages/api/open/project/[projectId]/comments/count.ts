import { NextApiRequest, NextApiResponse } from 'next'
import {
  apiHandler,
  HTTPException,
  prisma,
} from '../../../../../../utils.server'
import Cors from 'cors'
import { resolveCorsOrigin } from '../../../../../../service/request-security.service'

export default apiHandler()
  .use(
    Cors({
      // Only allow requests with GET, POST and OPTIONS
      methods: ['GET', 'POST', 'OPTIONS'],
      origin: resolveCorsOrigin,
    })
  )
  .get(async (req, res) => {
    const { projectId, pageIds } = req.query as {
      pageIds: string
      projectId: string
    }

    if (typeof pageIds !== 'string') {
      throw HTTPException.badRequest('pageIds is required')
    }

    if (typeof projectId !== 'string' || !projectId || projectId.length > 64) {
      throw HTTPException.badRequest('projectId is invalid')
    }

    const requestedPageIds = pageIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    if (requestedPageIds.length === 0 || requestedPageIds.length > 100) {
      throw HTTPException.badRequest('pageIds must contain between 1 and 100 items')
    }

    if (requestedPageIds.some((id) => id.length > 512)) {
      throw HTTPException.badRequest('pageId is too long')
    }

    const data = {}

    const counts = (
      await prisma.$transaction(
        requestedPageIds.map((id) => {
          return prisma.comment.count({
            where: {
              deletedAt: null,
              approved: true,
              page: {
                slug: id,
                projectId,
              },
            },
          })
        }),
      )
    ).forEach((count, index) => {
      data[requestedPageIds[index]] = count
    })

    res.json({
      data,
    })
  })
