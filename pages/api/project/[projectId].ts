import { Project } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { AuthService } from "../../../service/auth.service";
import { ProjectService } from "../../../service/project.service";
import { prisma } from "../../../utils.server";
import { assertSafeWebhookUrl } from "../../../service/webhook-url.service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const authService = new AuthService(req, res)
  const projectService = new ProjectService(req)

  if (req.method === 'PUT') {
    const { projectId } = req.query as {
      projectId: string
    }
    const body = req.body as {
      enableNotification?: boolean,
      webhookUrl?: string,
      enableWebhook?: boolean
    }

    const project = (await projectService.get(projectId, {
      select: {
        ownerId: true,
      },
    })) as Pick<Project, 'ownerId'> | null

    if (!(await authService.projectOwnerGuard(project))) {
      return
    }

    if (
      body.enableNotification !== undefined &&
      typeof body.enableNotification !== 'boolean'
    ) {
      res.status(400).json({ message: 'enableNotification must be a boolean' })
      return
    }
    if (body.enableWebhook !== undefined && typeof body.enableWebhook !== 'boolean') {
      res.status(400).json({ message: 'enableWebhook must be a boolean' })
      return
    }
    if (body.webhookUrl !== undefined && typeof body.webhookUrl !== 'string') {
      res.status(400).json({ message: 'webhookUrl must be a string' })
      return
    }

    let webhookUrl = body.webhookUrl?.trim()
    if (webhookUrl !== undefined && webhookUrl !== '') {
      try {
        webhookUrl = await assertSafeWebhookUrl(webhookUrl)
      } catch (error) {
        res.status(400).json({
          message: error.message,
        })
        return
      }
    }

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        enableNotification: body.enableNotification,
        enableWebhook: body.enableWebhook,
        webhook: webhookUrl
      },
    })

    res.json({
      message: 'success'
    })
  } else if (req.method === 'DELETE') {
    const { projectId } = req.query as {
      projectId: string
    }

    const project = (await projectService.get(projectId, {
      select: {
        ownerId: true,
      },
    })) as Pick<Project, 'ownerId'> | null

    if (!(await authService.projectOwnerGuard(project))) {
      return
    }

    await projectService.delete(projectId)

    res.json({
      message: 'success'
    })
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE'])
    res.status(405).json({ message: 'Method not allowed' })
  }
}
