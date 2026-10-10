import { Comment } from '@prisma/client'
import axios from 'axios'
import { RequestScopeService } from '.'
import { prisma, resolvedConfig } from '../utils.server'
import { statService } from './stat.service'
import {
  parseWebhookUrl,
  safeHttpAgent,
  safeHttpsAgent,
} from './webhook-url.service'

export enum HookType {
  NewComment = 'new_comment',
}

export type HookBody<T> = {
  type: HookType
  data: T
}

export type NewCommentHookData = {
  by_nickname: string
  by_email: string
  project_title: string
  page_id: string
  page_title: string
  content: string
  manage_link: string
  approve_link: string
}

export class WebhookService extends RequestScopeService {
  async addComment(comment: Comment, projectId: string) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    })

    if (project.enableWebhook && !comment.moderatorId && project.webhook) {
      parseWebhookUrl(project.webhook)

      const fullComment = await prisma.comment.findUnique({
        where: {
          id: comment.id,
        },
        select: {
          page: {
            select: {
              title: true,
              slug: true,
              project: {
                select: {
                  title: true
                }
              }
            },
          },
        },
      })

      const manageLink = `${resolvedConfig.host}/dashboard/project/${projectId}`

      statService.capture('webhook_trigger', {
        properties: {
          from: 'add_comment',
        },
      })

      try {
        await axios.post(project.webhook, {
          type: HookType.NewComment,
          data: {
            by_nickname: comment.by_nickname,
            by_email: comment.by_email,
            content: comment.content,
            page_id: fullComment.page.slug,
            page_title: fullComment.page.title,
            project_title: fullComment.page.project.title,
            manage_link: manageLink,
            // Keep the legacy field so existing webhook consumers do not break.
            approve_link: manageLink,
          },
        } as HookBody<NewCommentHookData>, {
          httpAgent: safeHttpAgent,
          httpsAgent: safeHttpsAgent,
          maxContentLength: 64 * 1024,
          maxRedirects: 0,
          timeout: 5_000,
        })
      } catch (e) {
        
      }
    }
  }
}
