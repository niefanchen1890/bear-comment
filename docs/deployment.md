# 部署手冊

本 fork 的正式支援組合是 Node.js 22、pnpm 8.15.9、Prisma 5.22 與
PostgreSQL 16。正式環境必須由 HTTPS reverse proxy 對外提供服務。

## 1. 環境變數

複製範例並產生獨立密鑰：

```sh
cp .env.example .env
openssl rand -hex 32
chmod 600 .env
```

### 必填

| 變數 | 用途 |
| --- | --- |
| `POSTGRES_DB` | PostgreSQL database 名稱 |
| `POSTGRES_USER` | PostgreSQL 使用者 |
| `POSTGRES_PASSWORD` | PostgreSQL 密碼 |
| `DB_URL` | 完整 PostgreSQL connection URL；保留字必須 URL encode |
| `NEXTAUTH_URL` | Bear Comment 的公開 HTTPS URL |
| `HOST` | 同一個 Bear Comment 公開 HTTPS URL |
| `JWT_SECRET` | 至少 32 字元的隨機值 |
| `CUSDIS_ADMIN_USERNAME` | 本地管理員登入名稱 |
| `CUSDIS_ADMIN_PASSWORD` | 至少 12 字元的管理員密碼 |
| `CORS_ORIGINS` | 可嵌入 widget 的完整 origin，以逗號分隔 |

Compose 會設定 `DB_TYPE=pgsql`。原生部署必須自行設定。

### 網路與 rate limit

| 變數 | 建議值 | 說明 |
| --- | --- | --- |
| `CUSDIS_PORT` | `3000` | host loopback port |
| `TRUST_PROXY` | `true` | 只在可信 reverse proxy 重寫 client IP headers 時使用 |
| `COMMENT_RATE_LIMIT_MAX` | `5` | 每個視窗最多評論數 |
| `COMMENT_RATE_LIMIT_WINDOW_SECONDS` | `60` | 評論限制視窗 |
| `LOGIN_RATE_LIMIT_MAX` | `10` | 每個登入限制視窗最多嘗試數 |
| `LOGIN_RATE_LIMIT_WINDOW_SECONDS` | `900` | 登入限制視窗 |

### 選用

- OAuth：`GITHUB_ID/GITHUB_SECRET`、`GITLAB_ID/GITLAB_SECRET`、
  `GOOGLE_ID/GOOGLE_SECRET`；啟用任一 provider 時必須設定 `ALLOWED_AUTH_EMAILS`。
- Email：`SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、
  `SMTP_PASSWORD`、`SMTP_SENDER`。
- Telegram：`TELEGRAM_BOT_TOKEN` 與 `TELEGRAM_CHAT_ID` 必須一起設定。
- 錯誤追蹤：`SENTRY_DSN`。

啟動前可手動驗證：

```sh
node scripts/validate-env.mjs
```

## 2. Docker Compose 部署

```sh
docker compose config
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:3000/api/health
```

Compose 行為：

- PostgreSQL 使用 named volume `cusdis_postgres_data`。
- PostgreSQL 沒有 host port。
- Bear Comment 只綁定 `127.0.0.1:${CUSDIS_PORT:-3000}`。
- application 等待 PostgreSQL healthy。
- container 啟動時先執行 `prisma migrate deploy`，再啟動 Next.js。
- 已套用的 migration 會被略過，重啟不會重複修改 schema。
- application 與 database log 都輪替為 10 MB × 3。

## 3. nginx

repository 提供 `deploy/nginx-comments.conf`。替換 domain 與
`Content-Security-Policy: frame-ancestors` 中的 Hugo origins，再啟用 site。

主要 proxy 設定：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
}
```

`X-Forwarded-For` 必須覆寫，而不是附加瀏覽器提供的值。使用 CDN proxy 時，
先按 CDN 公布的 IP ranges 設定 nginx `real_ip`，再讓 rate limit 使用
`$remote_addr`。

```sh
nginx -t
systemctl reload nginx
certbot --nginx -d comments.example.com
certbot renew --dry-run
```

## 4. Node.js 原生部署

安裝 Node.js 22、pnpm 8.15.9 與 PostgreSQL 16。`DB_URL` 必須指向實際
PostgreSQL 位址。

```sh
corepack enable
corepack prepare pnpm@8.15.9 --activate
pnpm install --frozen-lockfile
export DB_TYPE=pgsql
pnpm run build
pnpm run release
pnpm run start:production
```

`release` 負責環境驗證、Prisma client 生成與 migration；每個版本只需在啟動前執行。
正式服務應由 systemd 等 process manager 管理，並分開設定 migration 與 start。

## 5. PostgreSQL 備份

不要複製正在運行的 volume 檔案；使用 PostgreSQL logical backup：

```sh
docker compose exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > cusdis-$(date +%F).dump
chmod 600 cusdis-$(date +%F).dump
```

安裝 repository 中的自動備份：

```sh
install -m 755 deploy/backup-cusdis /usr/local/sbin/backup-cusdis
install -m 644 deploy/cusdis-backup.service deploy/cusdis-backup.timer \
  /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now cusdis-backup.timer
```

預設備份位置是 `/var/backups/bear-comment`，保留 14 天。可透過
`CUSDIS_APP_DIR` 與 `CUSDIS_BACKUP_DIR` 調整應用與備份路徑。必須另存一份至 VPS 以外的位置。

## 6. 還原

先在獨立測試 database 演練。正式還原需要維護視窗：

```sh
docker compose stop app
cat cusdis-YYYY-MM-DD.dump | docker compose exec -T postgres \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists'
docker compose up -d app
docker compose exec -T app \
  pnpm exec prisma migrate status --schema prisma/pgsql/schema.prisma
```

## 7. 升級

1. 閱讀 commit diff、dependency 和 Prisma migrations。
2. 執行並確認新備份。
3. 以 `pnpm install --frozen-lockfile` 或 Docker build 建置。
4. 執行 production build 與 TypeScript 檢查。
5. 套用 migration，再重啟 application。
6. 驗證 health、管理員登入、匿名提交、Telegram/Email/Webhook、批准與刪除。
7. 保留前一個 application image/revision。

application rollback 和 database rollback 是兩件事。若新版已修改 schema，除非舊版與新 schema
相容，否則必須一起還原對應的 PostgreSQL backup。
