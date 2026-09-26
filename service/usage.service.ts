import { RequestScopeService } from ".";
import { UsageLabel } from "../config.common";
import { prisma } from "../utils.server";

export class UsageService extends RequestScopeService {
  async incr(label: UsageLabel, userId?: string) {
    const resolvedUserId = userId || (await this.getSession())?.uid

    if (!resolvedUserId) {
      throw new Error('User is required to update usage')
    }

    await prisma.usage.upsert({
      where: {
        userId_label: {
          userId: resolvedUserId,
          label,
        }
      },
      create: {
        userId: resolvedUserId,
        label,
        count: 1
      },
      update: {
        count: {
          increment: 1
        }
      }
    })
  }
}
