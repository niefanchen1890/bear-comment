# Node.js 原生部署

正式支援 Node.js 22、pnpm 8.15.9 與 PostgreSQL 16。

```sh
corepack enable
corepack prepare pnpm@8.15.9 --activate
pnpm install --frozen-lockfile
export DB_TYPE=pgsql
pnpm run build
pnpm run release
pnpm run start:production
```

- `release` 驗證環境並執行 `prisma migrate deploy`。
- `start:production` 再次驗證環境並啟動 Next.js。
- 使用 systemd 等 process manager 管理服務。
- 只監聽 loopback，透過 nginx/Caddy 提供 HTTPS。
- PostgreSQL 必須獨立做備份，不可把 application directory 當成資料備份。
