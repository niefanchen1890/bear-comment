import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../utils.server'
import { CommentService } from '../../../service/comment.service'
import { SecretKey, TokenBody, TokenService } from '../../../service/token.service'
import { UsageService } from '../../../service/usage.service'
import { SubscriptionService } from '../../../service/subscription.service'
import { UsageLabel, usageLimitation } from '../../../config.common'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const commentService = new CommentService(req)
  const usageService = new UsageService(req)
  const subscriptionService = new SubscriptionService()

  const tokenService = new TokenService()

  if (req.method === 'GET') {
    const { token } = req.query as {
      token?: string
    }

    if (!token) {
      res.send('Invalid token')
      return
    }

    try {
      const result = tokenService.validate(
        token,
        SecretKey.ApproveComment,
      ) as TokenBody.ApproveComment
      await commentService.approve(result.commentId)
      res.send('Approved!')
      return
    } catch (e) {
      res.send('Invalid token')
      return
    }
  } else if (req.method === 'POST') {
    const { token } = req.query as {
      token?: string
    }

    const { replyContent } = req.body as {
      replyContent?: string
    }

    if (
      replyContent !== undefined &&
      (typeof replyContent !== 'string' || replyContent.trim().length > 10_000)
    ) {
      res.status(400).json({ message: 'replyContent is invalid' })
      return
    }

    if (!token) {
      res.status(403)
      res.send('Invalid token')
      return
    }

    let tokenBody: TokenBody.ApproveComment

    try {
      tokenBody = tokenService.validate(token, SecretKey.ApproveComment) as TokenBody.ApproveComment
    } catch (e) {
      res.status(403)
      res.send('Invalid token')
      return
    }

    // check usage
    const owner = await prisma.user.findUnique({
      where: { id: tokenBody.ownerId },
    })
    if (!owner) {
      res.status(403).send('Invalid token')
      return
    }

    if (!await subscriptionService.quickApproveValidate(owner.id)) {
      res.status(402).json({
        error: `You have reached the maximum number of Quick Approve on free plan (${usageLimitation.quick_approve}/month). Please upgrade to Pro plan to use Quick Approve more.`
      })
      return
    }

    // firstly, approve comment
    await commentService.approve(tokenBody.commentId)

    // then append reply
    if (replyContent?.trim()) {
      await commentService.addCommentAsModerator(tokenBody.commentId, replyContent.trim(), {
        owner
      })
    }

    await usageService.incr(UsageLabel.QuickApprove, owner.id)

    res.json({
      message: 'success'
    })
    return
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).json({ message: 'Method not allowed' })
}
