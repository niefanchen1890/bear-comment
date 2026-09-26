import { NextApiRequest, NextApiResponse } from 'next'
import {
  CommentService,
  CommentWrapper,
} from '../../../service/comment.service'
import { apiHandler, HTTPException } from '../../../utils.server'
import Cors from 'cors'
import { ProjectService } from '../../../service/project.service'
import { statService } from '../../../service/stat.service'
import {
  checkCommentRateLimit,
  resolveCorsOrigin,
} from '../../../service/request-security.service'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '64kb',
    },
  },
}

function requiredString(value: unknown, name: string, maxLength: number) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw HTTPException.badRequest(`${name} is required`)
  }

  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw HTTPException.badRequest(`${name} is too long`)
  }

  return trimmed
}

function optionalString(value: unknown, name: string, maxLength: number) {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value !== 'string' || value.length > maxLength) {
    throw HTTPException.badRequest(`${name} is invalid`)
  }

  return value.trim()
}

function optionalHttpUrl(value: unknown) {
  const normalized = optionalString(value, 'pageUrl', 2048)
  if (!normalized) {
    return undefined
  }

  let url: URL
  try {
    url = new URL(normalized)
  } catch {
    throw HTTPException.badRequest('pageUrl is invalid')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw HTTPException.badRequest('pageUrl must use http or https')
  }

  return url.toString()
}

export default apiHandler()
  .use(
    Cors({
      // Only allow requests with GET, POST and OPTIONS
      methods: ['GET', 'POST', 'OPTIONS'],
      origin: resolveCorsOrigin,
    }),
  )
  .get(async (req, res) => {
    const commentService = new CommentService(req)
    const projectService = new ProjectService(req)

    // get all comments
    const query = req.query as {
      page?: string
      appId: string
      pageId: string
    }

    const timezoneOffsetInMinutes = req.headers['x-timezone-offset']
    const appId = requiredString(query.appId, 'appId', 64)
    const pageId = requiredString(query.pageId, 'pageId', 512)
    const pageNumber = query.page === undefined ? 1 : Number(query.page)
    const timezoneOffset = Number(timezoneOffsetInMinutes || 0)

    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 10_000) {
      throw HTTPException.badRequest('page is invalid')
    }
    // JavaScript Date#getTimezoneOffset and dayjs#utcOffset use minutes.
    // IANA time zones currently range from UTC-12 to UTC+14.
    if (!Number.isInteger(timezoneOffset) || timezoneOffset < -720 || timezoneOffset > 840) {
      throw HTTPException.badRequest('timezone offset is invalid')
    }

    const isDeleted = await projectService.isDeleted(appId)

    if (isDeleted) {
      res.status(404)
      res.json({
        data: {
          commentCount: 0,
          data: [],
          pageCount: 0,
          pageSize: 10,
        } as CommentWrapper,
      })
      return
    }

    statService.capture('get_comments', {
      identity: appId,
      properties: {
        from: 'open_api',
      },
    })

    const queryCommentStat = statService.start(
      'query_comments',
      'Query Comments',
      {
        tags: {
          project_id: appId,
          from: 'open_api',
        },
      },
    )

    const comments = await commentService.getComments(
      appId,
      timezoneOffset,
      {
        approved: true,
        parentId: null,
        pageSlug: pageId,
        page: pageNumber,
        select: {
          by_nickname: true,
          moderator: {
            select: {
              displayName: true
            }
          }
        },
      },
    )

    queryCommentStat.end()

    res.json({
      data: comments,
    })
  })
  .post(async (req, res) => {
    const commentService = new CommentService(req)
    const projectService = new ProjectService(req)
    // add comment
    const body = req.body as {
      parentId?: string
      appId: string
      pageId: string
      content: string
      acceptNotify?: boolean
      email: string
      nickname: string
      pageUrl?: string
      pageTitle?: string
    }

    const appId = requiredString(body.appId, 'appId', 64)
    const pageId = requiredString(body.pageId, 'pageId', 512)
    const content = requiredString(body.content, 'content', 10_000)
    const nickname = requiredString(body.nickname, 'nickname', 80)
    const email = optionalString(body.email, 'email', 254) || ''
    const pageTitle = optionalString(body.pageTitle, 'pageTitle', 300)
    const pageUrl = optionalHttpUrl(body.pageUrl)
    const parentId = optionalString(body.parentId, 'parentId', 128)

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw HTTPException.badRequest('email is invalid')
    }

    const rateLimit = checkCommentRateLimit(req, appId)
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining)
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', rateLimit.retryAfter)
      throw HTTPException.tooManyRequests('Too many comments')
    }

    const isDeleted = await projectService.isDeleted(appId)

    if (isDeleted) {
      res.status(404)
      res.json({
        message: 'Project not found',
      })
      return
    }

    const comment = await commentService.addComment(
      appId,
      pageId,
      {
        content,
        email,
        nickname,
        pageTitle,
        pageUrl,
      },
      parentId,
    )

    // send confirm email
    if (body.acceptNotify === true && email) {
      try {
        await commentService.sendConfirmReplyNotificationEmail(
          email,
          pageTitle || pageId,
          comment.id,
        )
      } catch (e) {
        // TODO: log error
      }
    }

    statService.capture('add_comment')

    res.json({
      data: comment,
    })
  })
