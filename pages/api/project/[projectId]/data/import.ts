import { NextApiRequest, NextApiResponse } from 'next'

import formidable from 'formidable'
import { DataService } from '../../../../../service/data.service'
import * as fs from 'fs'
import { AuthService } from '../../../../../service/auth.service'
import { ProjectService } from '../../../../../service/project.service'
import { Project } from '@prisma/client'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const authService = new AuthService(req, res)
  const projectService = new ProjectService(req)

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const dataService = new DataService()
  const { projectId } = req.query as { projectId: string }

  const project = (await projectService.get(projectId, {
    select: {
      ownerId: true,
    },
  })) as Pick<Project, 'ownerId'> | null

  if (!(await authService.projectOwnerGuard(project))) {
    return
  }

  try {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 20 * 1024 * 1024,
      allowEmptyFiles: false,
    })
    const [, files] = await form.parse(req)
    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!file) {
      res.status(400).json({ message: 'A Disqus XML export is required' })
      return
    }

    const imported = await dataService.importFromDisqus(
      projectId,
      await fs.promises.readFile(file.filepath, { encoding: 'utf-8' }),
    )

    res.json({
      data: {
        pageCount: imported.threads.length,
        commentCount: imported.posts.length,
      },
    })
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Import failed',
    })
  }
}
