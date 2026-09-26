# 通知

Bear Comment 支援三種互相獨立的通知：

1. **Email**：設定 SMTP/SendGrid 與管理員通知 email。
2. **Telegram**：在 `.env` 設定 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID`。
3. **Generic Webhook**：在 Project Settings 儲存 HTTPS webhook URL 並啟用 switch。

通知只由訪客新評論觸發；管理員回覆不會重複通知。通知失敗不會令評論提交失敗。

Telegram 不傳送訪客 email。Generic Webhook payload 仍包含上游相容欄位；接收端應按自己的
隱私需求處理和保存資料。
