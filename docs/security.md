# 安全說明

## 已實作的防護

### 認證與授權

- 管理 API 使用 NextAuth JWT session。
- 所有 project/comment 管理操作都檢查資源是否屬於目前管理員。
- 本地初始密碼、JWT secret 和 OAuth 都在啟動前驗證。
- 後台可修改本地管理員密碼；密碼以 scrypt 加鹽雜湊存入 PostgreSQL。
- 修改密碼 API 檢查 session、同源請求、現有密碼與 rate limit。
- 密碼版本會綁定 JWT；修改密碼後，舊的管理 session 會失效。
- OAuth 只允許 `ALLOWED_AUTH_EMAILS` 中的帳號。
- 審核連結是有期限的簽名 token；收到連結的人可批准評論，因此必須當作敏感資料。

### 公開評論 API

- 評論內容、暱稱、email、URL、page ID 與 request body 有大小限制。
- Markdown 不支援 raw HTML、圖片和可點擊連結。
- 新評論預設不公開，必須經過審核。
- 公開評論和管理員登入有獨立 rate limit。
- `CORS_ORIGINS` 只允許指定的 Hugo origin。

### Webhook 與 Telegram

- Generic Webhook 在儲存 URL 及每次連線時都檢查 DNS/IP。
- private、loopback、link-local、reserved 與 multicast IP 均被拒絕。
- 不跟隨 redirect，連線 timeout 為 5 秒。
- Telegram 只連線固定的 `api.telegram.org`，通知不包含訪客 email。
- Telegram Bot Token 會經 HTTPS 傳給 Telegram，只可存於 mode `0600` 的 `.env`。

### 基礎設施

- Node.js runtime 使用 non-root user。
- PostgreSQL 只存在 Docker private network。
- Node port 只綁定 loopback，nginx 是唯一公開入口。
- nginx 終止 TLS，並加入 HSTS、CSP、`nosniff` 和 Referrer Policy。
- `.env`、管理員 credential note 與備份檔權限為 `0600`。

## 仍需了解的限制

- rate limit 目前儲存在單一 application process 記憶體。擴展為多個 instance 前，應改用 Redis 或 reverse proxy shared limit。
- 專案沒有 CAPTCHA 或完整 spam classifier；大量公開流量時應再增加 nginx/CDN rate limit。
- 審核連結有效期為三天，不應轉傳或發佈。
- Telegram 通知會將暱稱、頁面、評論內容與審核連結傳至 Telegram 伺服器。
- Dependency audit 只反映執行當日已公開的 advisory；升級前應重新執行 `pnpm audit --prod`。

## 機密資料

不得 commit 或傳送以下內容：

- `.env`
- PostgreSQL password
- `JWT_SECRET`
- 管理員密碼
- OAuth client secret
- SMTP password
- Telegram Bot Token
- PostgreSQL backup
