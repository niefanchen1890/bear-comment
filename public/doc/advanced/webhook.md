# Generic Webhook

在 Project → Settings 儲存 HTTPS URL，再啟用 Webhook switch。新訪客評論會 POST：

```json
{
  "type": "new_comment",
  "data": {
    "by_nickname": "visitor",
    "by_email": "optional@example.com",
    "content": "comment text",
    "page_id": "/post/example/",
    "page_title": "Example",
    "project_title": "My site",
    "approve_link": "https://comments.example.com/open/approve?token=..."
  }
}
```

## 安全限制

- 只接受 HTTP/HTTPS，正式環境應使用 HTTPS。
- URL 不可包含 username/password。
- DNS 解析到 private、loopback、link-local 或 reserved IP 時拒絕。
- 連線時再次檢查 DNS，避免 DNS rebinding。
- 不跟隨 redirect，timeout 5 秒。
- 接收端必須保護訪客 email 與審核連結。

Telegram 請使用本 fork 的原生 Telegram 設定，不需啟用 Generic Webhook。
