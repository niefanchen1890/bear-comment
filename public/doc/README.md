# Bear Comment 自託管評論系統

這個 Bear Comment fork 為 Hugo + PaperMod 提供匿名評論。訪客不需帳號；新評論提交後立即公開，
管理員可在後台刪除不適當內容。

## 使用者流程

1. 在文章底部輸入暱稱、選填 email 與評論內容。
2. 按「發送」。
3. 評論立即顯示在原文章。
4. 管理員收到 Email、Telegram 或 Webhook 通知。
5. 管理員可在 dashboard 回覆或刪除評論。

## 管理入口

- Dashboard：[/dashboard](/dashboard)
- Project 可管理評論、回覆、刪除與設定。
- 首次登入後，可從後台右上角的使用者設定修改管理員密碼。
- 管理員登入資料只應保存在 password manager 或伺服器的安全 credential note。

## 資料控制

```text
Hugo / PaperMod
  ↓
自託管 Bear Comment widget 與 API
  ↓
自託管 PostgreSQL
```

評論不依賴原作者的 Hosted Service。選用 Telegram 通知時，暱稱、頁面、評論內容與管理連結
會傳至 Telegram；訪客 email 不會傳送。

## 支援環境

- Node.js 22 LTS
- pnpm 8.15.9
- PostgreSQL 16
- Docker Compose 或 Node.js 原生部署
- HTTPS reverse proxy
