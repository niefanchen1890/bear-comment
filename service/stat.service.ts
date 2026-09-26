import { sentry } from '../utils.server'
export class StatService {
  async capture(
    event: string,
    options?: {
      identity?: string
      properties: any
    },
  ) {
    return null
  }

  start(
    op: string,
    name: string,
    options?: {
      description?: string
      tags?: Record<string, string>
    },
  ) {
    if (sentry) {
      const transaction = sentry.startTransaction({
        op,
        name,
        tags: options?.tags,
        description: options?.description,
      })
      return {
        end() {
          transaction.finish()
        },
      }
    } else {
      return {
        end() {},
      }
    }
  }
}

export const statService = new StatService()
