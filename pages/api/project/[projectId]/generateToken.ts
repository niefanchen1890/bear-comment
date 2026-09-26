/**
 * Deprecated
 */

import { NextApiRequest, NextApiResponse } from "next";
import { Project } from "@prisma/client";
import { AuthService } from "../../../../service/auth.service";
import { ProjectService } from "../../../../service/project.service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const projectService = new ProjectService(req)
  const authService = new AuthService(req, res)

  if (req.method === 'POST') {
    const projectId = req.query.projectId as string
    const project = (await projectService.get(projectId, {
      select: { ownerId: true },
    })) as Pick<Project, 'ownerId'> | null

    if (!(await authService.projectOwnerGuard(project))) {
      return
    }

    const token = await projectService.regenerateToken(projectId)
    res.json({
      data: token
    })
    return
  }

  res.setHeader('Allow', ['POST'])
  res.status(405).json({ message: 'Method not allowed' })
}
