# Bear Comment 自託管維護版

這是從 `djyde/cusdis` 延續維護的自託管 fork，主要用於 Hugo +
PaperMod 網站。訪客不需註冊或登入即可留言；新評論預設為待審核，
只有管理員批准後才會公開。

本 fork 保留原有 Next.js Pages Router、Prisma、PostgreSQL、管理後台與
Svelte widget 架構，只進行建置、安全、相容性和維運所需的修正。

## 支援基線

- Node.js 22 LTS
- pnpm 8.15.9
- Next.js 15 + React 18
- NextAuth 4（JWT session + Prisma adapter）
- Prisma 5.22
- PostgreSQL 16
- Svelte 4 + Vite 5 widget
- Docker Compose 或 Node.js 原生部署

SQLite 與 MySQL schema 僅保留來自上游的相容性；本 fork 的正式環境只支援
PostgreSQL。

## 主要功能

- 匿名評論、待審核發佈、管理員回覆與刪除
- 登入後修改管理員密碼，並使舊 session 失效
- Hugo/PaperMod 嵌入與繁體中文 widget
- 精確 CORS allowlist、評論與登入 rate limit
- 選用 SMTP/SendGrid、Generic Webhook 與 Telegram Bot 通知
- PostgreSQL migration、每日備份、還原與 Docker log rotation
- nginx 反向代理、HTTPS、HSTS、CSP 與 non-root container

## 架構

```text
Hugo / PaperMod
       |
       |  HTTPS widget + anonymous comment API
       v
Bear Comment / Next.js
       |
       |  Prisma
       v
PostgreSQL
       |
       +--> Telegram / Email / Generic Webhook（選用）
```

評論、審核狀態、專案與管理員資料都儲存在自己的 PostgreSQL。

## 開發快速開始

```sh
corepack enable
corepack prepare pnpm@8.15.9 --activate
pnpm install --frozen-lockfile
export DB_TYPE=pgsql
export DB_URL=postgresql://localhost/cusdis
pnpm run db:deploy
pnpm run dev:pg
```

正式環境請以 `.env.example` 為設定基準。`start:production` 會驗證資料庫、
URL、密鑰、管理員登入、CORS 及選用的 Telegram 設定。

## 中文手冊

- [手冊索引](docs/README.md)
- [架構與本 fork 的修改](docs/architecture-and-changes.md)
- [Docker 與 Node.js 部署](docs/deployment.md)
- [Hugo + PaperMod 整合](docs/hugo-papermod.md)
- [Telegram 新評論通知](docs/telegram.md)
- [安全說明](docs/security.md)
- [故障排查](docs/troubleshooting.md)

建置後也可在 Bear Comment 網站的 `/doc` 閱讀精簡版公開手冊。

## 安全原則

- Hugo 與 Bear Comment 都必須使用 HTTPS。
- `CORS_ORIGINS` 只列出允許嵌入 widget 的完整 origin。
- PostgreSQL 不對公網開放；Bear Comment Node port 只綁定 loopback。
- 資料庫密碼、管理員密碼、`JWT_SECRET` 與 Telegram Bot Token 必須分開生成與保管。
- 每次升級前先做 PostgreSQL 備份，資料庫 migration 不可只靠應用程式 rollback。

## License

GNU GPLv3，詳見 [LICENSE](LICENSE)。

## 來源與修改者

Bear Comment 基於 [Cusdis](https://github.com/djyde/cusdis)（原作者 Randy Lu / djyde）修改，依 GNU GPLv3 授權。本維護版由 Fr Patrick Lim 修改，使用 OpenAI Codex 協助。完整說明見 [NOTICE.md](NOTICE.md)。
