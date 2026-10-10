# 評論管理

新訪客評論建立時為 `approved=true`，提交後立即公開。

管理員可在 dashboard：

- **Delete**：軟刪除評論，不再公開顯示。
- **Reply**：以管理員身分回覆評論。

Telegram、Email 或 Generic Webhook 會通知新評論並提供管理後台連結。Dashboard 需要管理員
登入，刪除 API 也會檢查評論所屬專案。
