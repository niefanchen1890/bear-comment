# 架構與本 fork 的修改

## 現有架構

```text
瀏覽器
  |
  +-- Hugo/PaperMod 靜態 HTML
  |      |
  |      +-- cusdis.es.js
  |             |
  |             +-- srcdoc iframe + iframe.umd.js
  |                    |
  |                    +-- /api/open/comments
  |
  +-- Bear Comment 管理後台
         |
         +-- NextAuth JWT session
         +-- 回覆、刪除、專案設定

Next.js Pages Router
  |
  +-- Prisma 5.22
         |
         +-- PostgreSQL 16

新評論 hook
  |
  +-- Email（選用）
  +-- Generic Webhook（選用）
  +-- Telegram Bot API（選用）
```

## 保留的上游設計

- Next.js Pages Router 和 API routes
- React 管理後台
- Svelte iframe widget
- Prisma data model 與 PostgreSQL migrations
- NextAuth 管理員登入
- 專案、頁面、評論、回覆和管理流程
- Email、Generic Webhook、Disqus XML import

## 建置與 dependency 現代化

- 固定 Node.js 22.23.3 與 pnpm 8.15.9。
- 升級至 Next.js 15、React 18、NextAuth 4、Prisma 5.22、Svelte 4 與 Vite 5。
- 移除舊 `yarn.lock`，以 `pnpm-lock.yaml` 作為唯一 lockfile。
- 移除不必要的 native XML dependency，降低 ARM64/AMD64 建置風險。
- Docker multi-stage build 只保留 production dependencies，runtime 使用 non-root `node` 帳號。
- 加入 `/api/health`、Docker healthcheck 與環境變數啟動驗證。

## 認證與 API 修正

- NextAuth 4 JWT session 以 server-side token 驗證，不信任瀏覽器傳入的身分。
- 所有 project/comment 管理操作都檢查資源是否屬於目前管理員。
- 本地管理員帳號改用 `CUSDIS_ADMIN_USERNAME` / `CUSDIS_ADMIN_PASSWORD`。
- OAuth 啟用時必須設定 `ALLOWED_AUTH_EMAILS`。
- 關閉未配置的 subscription/checkout API。

## 評論與 widget 修正

- 限制 request body、欄位長度、email、URL、page number 和 timezone offset。
- 評論與登入加入獨立 rate limit。
- Markdown 關閉 raw HTML、image 與可點擊 link，降低 XSS 與追蹤風險。
- `/js/*` 公開 widget 資源回傳 CORS header，解決跨 origin module 無法執行。
- timezone offset 統一使用 JavaScript/Day.js 的「分鐘」單位，解決 UTC+8
  瀏覽器回傳 `480` 時 API 400 而隱藏表單的問題。
- 繁體中文語言檔在 widget script 前以 `defer` 載入，避免 `async` 時序競爭。
- PaperMod 明暗主題切換時同步 Bear Comment iframe 主題。
- 新匿名評論提交後立即公開；保留管理員回覆與軟刪除流程。

## 資料庫修正

- 保留現有 Project/Page/Comment/User 架構。
- 加入 `(projectId, slug)` 唯一索引，migration 先處理重複 page。
- 升級 NextAuth v4 adapter 所需 Account/Session/User/VerificationToken schema。
- fresh database 與 legacy database migration 均已驗證。

## 網路與通知修正

- `CORS_ORIGINS` 使用完整 origin 精確比對。
- `TRUST_PROXY=true` 時只接受由 nginx 重寫的 client IP headers。
- Generic Webhook 禁止 credential URL、private/reserved IP、redirect，並設定 timeout。
- 修正 Node.js 22 Agent 回傳多個 DNS address 時的誤判；仍會逐一攔截私有 IP。
- 加入原生 Telegram Bot 通知，Bot Token 和 Chat ID 只存於 `.env`。
- Telegram 通知包含需要登入的管理後台連結，不傳送訪客 email。

## 維運修正

- PostgreSQL 16 Docker volume，不發佈 host port。
- application 只綁定 `127.0.0.1:3000`，公網只經 nginx HTTPS。
- Docker log 限制為 10 MB × 3。
- 每日 `pg_dump -Fc` 備份，保留 14 天，並已做過還原演練。
- nginx 回傳 HSTS、CSP `frame-ancestors`、`nosniff` 與 Referrer Policy。
