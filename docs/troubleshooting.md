# 故障排查

先記錄目前 revision 與服務狀態：

```sh
cd /srv/bear-comment
cat DEPLOYED_COMMIT
docker compose ps
curl -i https://comments.example.com/api/health
```

## 只看到「評論」標題，看不到表單

檢查頁面是否輸出正確嵌入資料：

```sh
curl -fsS https://example.com/path/ | \
  grep -o 'cusdis_thread\|comments.example.com\|YOUR_PROJECT_ID'
```

檢查公開 widget 資源：

```sh
curl -fsSI https://comments.example.com/js/iframe.umd.js | \
  grep -Ei 'HTTP|Content-Type|Access-Control-Allow-Origin'
```

`iframe.umd.js` 必須回傳 JavaScript content type 和
`Access-Control-Allow-Origin: *`。這只適用於公開靜態 widget，不代表 API 對所有 origin 開放。

再檢查評論 API。JavaScript `Date#getTimezoneOffset()` 傳送分鐘，上海是 `480`：

```sh
curl -i \
  -H 'Origin: https://example.com' \
  -H 'x-timezone-offset: 480' \
  'https://comments.example.com/api/open/comments?appId=YOUR_PROJECT_ID&pageId=%2Ftest%2F'
```

若回傳 `timezone offset is invalid`，表示仍在使用把 offset 當成小時的舊版本。

## 表單顯示英文

語言檔必須先於 widget 載入，而且兩者都使用 `defer`：

```html
<script defer src="https://comments.example.com/js/widget/lang/zh-tw.js"></script>
<script defer src="https://comments.example.com/js/cusdis.es.js"></script>
```

不要加 `async`。清除 browser cache 或用無痕視窗重新驗證。

## 評論 API 回傳 403

檢查 `.env`：

```dotenv
CORS_ORIGINS=https://example.com,https://www.example.com
```

只接受 origin，不可帶 path 或 trailing slash。修改後重建 app：

```sh
docker compose up -d --force-recreate app
```

檢查：

```sh
curl -i -H 'Origin: https://example.com' \
  'https://comments.example.com/api/open/comments?appId=YOUR_PROJECT_ID&pageId=%2Ftest%2F'
```

允許來源應回傳相同的 `Access-Control-Allow-Origin`；未允許來源應回傳 403。

## Telegram 沒有通知

先確認兩個變數進入 container，但不要輸出實際值：

```sh
docker compose exec -T app node -e \
  'console.log({token:Boolean(process.env.TELEGRAM_BOT_TOKEN),chatId:Boolean(process.env.TELEGRAM_CHAT_ID)})'
```

檢查錯誤：

```sh
docker compose logs --since=30m app | grep 'Telegram notification failed'
```

Bot 必須先收到 `/start`。以 `getMe` 驗證 token，以 `getChat` 驗證 Chat ID。

若錯誤是 `private destination`，但 `api.telegram.org` 可正常連線，請升級至目前維護版。
目前版本支援 Node.js 22 DNS lookup 回傳地址陣列，同時逐一檢查所有 IP。

## 修改 `.env` 後功能沒有改變

`.env` 只在建立 container 時讀取。執行：

```sh
cd /srv/bear-comment
docker compose up -d --force-recreate app
docker compose ps
```

只執行 `docker compose restart` 不一定會把更新後的 Compose environment 重新注入。

## Application unhealthy

```sh
docker compose logs --tail=200 app
docker compose exec -T app node scripts/validate-env.mjs
docker compose exec -T postgres \
  sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

常見原因：

- `.env` 缺少必要值或成對的 OAuth/Telegram 變數。
- `DB_URL` 密碼沒有 URL encode。
- PostgreSQL 尚未 healthy。
- migration 失敗。
- port 3000 已被其他 process 使用。

## Prisma migration 問題

```sh
docker compose exec -T app \
  pnpm exec prisma migrate status --schema prisma/pgsql/schema.prisma
docker compose logs --tail=200 app
```

不要在正式 database 使用 `prisma migrate dev` 或 `db push`。正式環境只使用已審查的
`prisma migrate deploy`。任何手動修復前先做 backup。

## 無法登入 Dashboard

從密碼管理器或伺服器的安全 secrets store 確認管理員登入資料，不要在終端或日誌輸出密碼。
檢查 `NEXTAUTH_URL`、`HOST`、
`JWT_SECRET`、`CUSDIS_ADMIN_USERNAME` 與 `CUSDIS_ADMIN_PASSWORD`，再重建 app。

## Backup timer 失敗

```sh
systemctl status cusdis-backup.timer
systemctl status cusdis-backup.service
journalctl -u cusdis-backup.service --since=today
ls -ld /var/backups/bear-comment
```

確認 Docker Compose project 仍名為 `cusdis`、PostgreSQL container healthy，以及磁碟空間足夠。
