# Telegram 通知

## 建立與設定

1. 使用 `@BotFather` 建立 bot 並取得 token。
2. 向新 bot 發送 `/start`。
3. 使用 Bot API `getUpdates` 找到 Chat ID。
4. 在 Bear Comment `.env` 同時設定：

```dotenv
TELEGRAM_BOT_TOKEN=replace-with-bot-token
TELEGRAM_CHAT_ID=replace-with-chat-id
```

5. 重建 application container：

```sh
docker compose up -d --force-recreate app
```

Bot Token 是 secret，不可貼到 dashboard Webhook 欄位、commit 或公開日誌。

## 通知內容

- 專案與頁面
- 暱稱
- 評論內容
- 需要登入的管理後台連結

訪客 email 不會傳至 Telegram。

## 排查

```sh
docker compose exec -T app node -e \
  'console.log({token:Boolean(process.env.TELEGRAM_BOT_TOKEN),chatId:Boolean(process.env.TELEGRAM_CHAT_ID)})'
docker compose logs --since=30m app | grep 'Telegram notification failed'
```

Bot API 與 Generic Webhook payload 格式不同，不可把 Telegram `sendMessage` URL 直接當作
Bear Comment Webhook URL。
