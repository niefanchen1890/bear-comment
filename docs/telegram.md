# Telegram 新評論通知

## 工作方式

訪客送出評論後，Bear Comment 直接呼叫 Telegram Bot API `sendMessage`。通知內容包含：

- 專案名稱
- 頁面標題與 URL
- 訪客暱稱
- 評論內容
- 三天內有效的審核連結

訪客 email 不會傳給 Telegram，管理員回覆不會觸發新通知。

## 建立 Bot

1. 在 Telegram 開啟 `@BotFather`。
2. 發送 `/newbot` 並依提示建立 bot。
3. 保存 BotFather 提供的 token。
4. 開啟新 bot，發送 `/start`。

不要使用原作者的 `@CusdisBot` webhook；那是無法由本 fork 控制的第三方服務。

## 取得 Chat ID

在 VPS 以不寫入 shell history 的方式輸入 token：

```sh
read -rsp "Telegram Bot Token: " BOT_TOKEN
echo
curl -fsS "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates" |
python3 -c 'import json,sys; r=json.load(sys.stdin)["result"]; print(next((m["chat"]["id"] for x in reversed(r) if (m := x.get("message") or x.get("channel_post"))), "找不到對話，請先向 bot 發送 /start"))'
unset BOT_TOKEN
```

私人對話的 Chat ID 通常是正整數；group/channel 可能是負數。

## 啟用

在 `.env` 加入：

```dotenv
TELEGRAM_BOT_TOKEN=replace-with-bot-token
TELEGRAM_CHAT_ID=replace-with-chat-id
```

兩個值必須一起設定。修改後重建 application container：

```sh
chmod 600 .env
docker compose up -d --force-recreate app
docker compose ps
```

## 與 Generic Webhook 的差異

Bear Comment Generic Webhook 送出的 body 是：

```json
{
  "type": "new_comment",
  "data": {
    "by_nickname": "...",
    "content": "...",
    "page_id": "...",
    "page_title": "...",
    "project_title": "...",
    "approve_link": "..."
  }
}
```

Telegram `sendMessage` 需要 `chat_id` 和 `text`，因此不可把 Telegram API URL
直接貼到後台 Webhook 欄位。本 fork 的原生 Telegram service 會負責格式轉換。

## 驗證

1. 在 Hugo 頁面送出一則測試評論。
2. 確認評論保持待審核。
3. 確認 bot 收到「Bear Comment 新評論」。
4. 點擊審核連結或在 dashboard 批准。
5. 刪除測試評論。

## 診斷

```sh
docker compose exec -T app node -e \
  'console.log({token:Boolean(process.env.TELEGRAM_BOT_TOKEN),chatId:Boolean(process.env.TELEGRAM_CHAT_ID)})'
docker compose logs --since=30m app | grep 'Telegram notification failed'
```

如 `getMe`/`getChat` 成功但舊版程式顯示 `private destination`，代表仍在使用未修正
Node.js 22 multi-address DNS callback 的版本；請升級至目前維護版。
