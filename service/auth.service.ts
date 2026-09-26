import { Project } from '@prisma/client'
import { RequestScopeService } from '.'

export class AuthService extends RequestScopeService {
  constructor(req, private res) {
    super(req)
  }

  async authGuard() {
    const session = await this.getSession()
    if (!session) {
      this.res.status(403).json({
        message: 'Sign in required',
      })
      return null
    }
    return session
  }

  async projectOwnerGuard(project: Pick<Project, 'ownerId'> | null) {
    if (!project) {
      this.res.status(404).json({
        message: 'Project not found',
      })
      return null
    }

    const session = await this.authGuard()

    if (!session) {
      return null
    }

    if (project.ownerId !== session.uid) {
      this.res.status(403).json({
        message: 'Permission denied',
      })
      return null
    } else {
      return true
    }
  }
}
