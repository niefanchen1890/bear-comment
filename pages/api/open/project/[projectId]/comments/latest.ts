import { NextApiRequest, NextApiResponse } from "next";
import { ProjectService } from "../../../../../../service/project.service";
import { prisma } from "../../../../../../utils.server";
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectService = new ProjectService(req)
  if (req.method === 'GET') {
    const { projectId, token } = req.query as {
      projectId: string,
      token?: string
    }

    if (!token || token.length > 128) {
      res.status(403)
      res.json({
        message: 'Invalid token'
      })
      return
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      },
      select:{
        token: true,
        fetchLatestCommentsAt: true
      }
    })

    if (
      !project?.token ||
      project.token.length !== token.length ||
      !crypto.timingSafeEqual(Buffer.from(project.token), Buffer.from(token))
    ) {
      res.status(403)
      res.json({
        message: 'Invalid token',
      })
      return
    }

    const comments = await projectService.fetchLatestComment(projectId, {
      from: project.fetchLatestCommentsAt,
      markAsRead: true
    })

    res.json({
      comments: comments
    })
    return
  }

  res.setHeader('Allow', ['GET'])
  res.status(405).json({ message: 'Method not allowed' })
}
