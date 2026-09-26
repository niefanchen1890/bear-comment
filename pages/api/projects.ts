import { NextApiRequest, NextApiResponse } from "next";
import { ProjectService } from "../../service/project.service";
import { SubscriptionService } from "../../service/subscription.service";
import { getSession, prisma } from "../../utils.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const projectService = new ProjectService(req)
  const subscriptionService = new SubscriptionService()
  const session = await getSession(req)

  if (req.method === 'POST') {
    if (!session) {
      res.status(401).json({
        error: 'Unauthorized'
      })
      return
    }

    // check subscription
    if (!await subscriptionService.createProjectValidate(session.uid)) {
    // if (true) {
      res.status(402).json({
        error: 'You have reached the maximum number of sites on free plan. Please upgrade to Pro plan to create more sites.'
      })
      return
    }

    const { title } = req.body as {
      title: string
    }

    if (typeof title !== 'string' || !title.trim() || title.trim().length > 100) {
      res.status(400).json({ error: 'Title must contain between 1 and 100 characters' })
      return
    }

    const created = await projectService.create(title.trim())

    res.json({
      data: {
        id: created.id
      }
    })
  } else if (req.method === 'GET') {
    if (!session) {
      res.status(401).json({
        error: 'Unauthorized'
      })
      return
    }

    const projects = await projectService.list()
    res.json({
      data: projects
    })
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ message: 'Method not allowed' })
  }
}
