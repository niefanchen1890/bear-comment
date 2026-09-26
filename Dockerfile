FROM node:22.23.3-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && npm install --global pnpm@8.15.9 \
  && npm cache clean --force

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder

ENV NEXT_TELEMETRY_DISABLED=1
ENV DB_TYPE=pgsql
ENV DB_URL=postgresql://build:build@localhost:5432/build

COPY . .
RUN pnpm run build

FROM dependencies AS production-dependencies

ENV DB_TYPE=pgsql
COPY prisma ./prisma
RUN pnpm prune --prod && pnpm exec prisma generate --schema ./prisma/pgsql/schema.prisma

FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DB_TYPE=pgsql
ENV PORT=3000

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder --chown=node:node /app/next.config.js ./
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/scripts ./scripts

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["sh", "-c", "pnpm run release && exec pnpm run start:production"]
