import { NextApiRequest, NextApiResponse } from 'next'
import { AuthService } from '../../../../service/auth.service'
import { CommentService } from '../../../../service/comment.service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const commentService = new CommentService(req)
  const authService = new AuthService(req, res)

  if (req.method === 'POST') {
    const body = req.body as {
      content: string
    }
    const commentId = req.query.commentId as string

    if (
      typeof body.content !== 'string' ||
      !body.content.trim() ||
      body.content.trim().length > 10_000
    ) {
      res.status(400).json({ message: 'Content must contain between 1 and 10000 characters' })
      return
    }

    const project = await commentService.getProject(commentId)
    if (!(await authService.projectOwnerGuard(project))) {
      return
    }
    const created = await commentService.addCommentAsModerator(
      commentId,
      body.content.trim(),
    )
    res.json({
      data: created,
    })
    return
  }

  res.setHeader('Allow', ['POST'])
  res.status(405).json({ message: 'Method not allowed' })
}
