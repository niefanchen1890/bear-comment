import { RequestScopeService } from ".";
import { prisma } from "../utils.server";

export class PageService extends RequestScopeService {
  async upsertPage(
    slug: string,
    projectId: string,
    options?: {
      pageUrl?: string;
      pageTitle?: string;
    }
  ) {
    return prisma.page.upsert({
      where: {
        projectId_slug: {
          projectId,
          slug,
        },
      },
      update: {},
      create: {
        title: options?.pageTitle,
        url: options?.pageUrl,
        slug,
        projectId,
      },
    })
  }
}
