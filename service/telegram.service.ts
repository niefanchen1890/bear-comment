import { Comment } from '@prisma/client'
import axios from 'axios'
import { RequestScopeService } from '.'
import { prisma, resolvedConfig } from '../utils.server'
import { TokenService } from './token.service'
import { safeHttpsAgent } from './webhook-url.service'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 1)}…`
}

export class TelegramService extends RequestScopeService {
  tokenService = new TokenService()

  async addComment(comment: Comment, projectId: string) {
    const { botToken, chatId } = resolvedConfig.telegram
    if (!botToken || !chatId || comment.moderatorId) {
      return
    }

    const fullComment = await prisma.comment.findUnique({
      where: {
        id: comment.id,
      },
      select: {
        page: {
          select: {
            title: true,
            slug: true,
            url: true,
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    if (!fullComment || fullComment.page.project.id !== projectId) {
      return
    }

    const approveToken = await this.tokenService.genApproveToken(comment.id)
    const approveLink = `${resolvedConfig.host}/open/approve?token=${approveToken}`
    const pageLabel = fullComment.page.title || fullComment.page.slug
    const page = fullComment.page.url
      ? `<a href="${escapeHtml(fullComment.page.url)}">${escapeHtml(pageLabel)}</a>`
      : escapeHtml(pageLabel)

    const text = [
      '<b>Bear Comment 新評論</b>',
      `<b>專案：</b>${escapeHtml(fullComment.page.project.title)}`,
      `<b>頁面：</b>${page}`,
      `<b>暱稱：</b>${escapeHtml(comment.by_nickname)}`,
      '',
      `<b>內容：</b>\n${escapeHtml(truncate(comment.content, 2_500))}`,
      '',
      `<a href="${escapeHtml(approveLink)}">審核這則評論</a>`,
    ].join('\n')

    try {
      await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        },
        {
          httpsAgent: safeHttpsAgent,
          maxContentLength: 64 * 1024,
          maxRedirects: 0,
          timeout: 5_000,
        },
      )
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      const code = axios.isAxiosError(error) ? error.code : undefined
      console.error('Telegram notification failed', { status, code })
    }
  }
}
