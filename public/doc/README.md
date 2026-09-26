# Bear Comment 自託管評論系統

這個 Bear Comment fork 為 Hugo + PaperMod 提供匿名評論。訪客不需帳號；新評論先進入待審核，
管理員批准後才公開。

## 使用者流程

1. 在文章底部輸入暱稱、選填 email 與評論內容。
2. 按「發送」。
3. 評論進入待審核狀態。
4. 管理員在 dashboard、Email 或 Telegram 審核。
5. 批准後，評論顯示在原文章。

## 管理入口

- Dashboard：[/dashboard](/dashboard)
- Project 可管理評論、回覆、批准、刪除與設定。
- 管理員登入資料只應保存在 password manager 或伺服器的安全 credential note。

## 資料控制

```text
Hugo / PaperMod
  ↓
自託管 Bear Comment widget 與 API
  ↓
自託管 PostgreSQL
```

評論不依賴原作者的 Hosted Service。選用 Telegram 通知時，暱稱、頁面、評論內容與審核連結
會傳至 Telegram；訪客 email 不會傳送。

## 支援環境

- Node.js 22 LTS
- pnpm 8.15.9
- PostgreSQL 16
- Docker Compose 或 Node.js 原生部署
- HTTPS reverse proxy
