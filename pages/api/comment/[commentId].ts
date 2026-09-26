import { NextApiRequest, NextApiResponse } from "next";
import { AuthService } from "../../../service/auth.service";
import { CommentService } from "../../../service/comment.service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const commentService = new CommentService(req)
  const authService = new AuthService(req, res)

  if (req.method === 'DELETE') {
    const commentId = req.query.commentId as string
    const project = await commentService.getProject(commentId)

    if (!(await authService.projectOwnerGuard(project))) {
      return
    }

    await commentService.delete(commentId)
    res.json({
      message: 'Success'
    })
    return
  }

  res.setHeader('Allow', ['DELETE'])
  res.status(405).json({ message: 'Method not allowed' })
}
