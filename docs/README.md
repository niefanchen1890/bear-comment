# Bear Comment 中文維護手冊

本手冊以這個 fork 的實際程式與通用自託管部署為準。原作者的 Hosted
Service、Vercel、Railway 和第三方 `@CusdisBot` 流程不在本手冊的支援範圍。

## 閱讀順序

1. [架構與本 fork 的修改](architecture-and-changes.md)
2. [Docker 與 Node.js 部署](deployment.md)
3. [Hugo + PaperMod 整合](hugo-papermod.md)
4. [Telegram 新評論通知](telegram.md)
5. [安全說明](security.md)
6. [故障排查](troubleshooting.md)

## 支援範圍

- 正式資料庫：PostgreSQL 16
- 正式 Node.js：22 LTS
- package manager：pnpm 8.15.9
- 建議入口：nginx/Caddy HTTPS reverse proxy
- 嵌入網站：Hugo + PaperMod
- 評論模式：匿名留言、先審核後公開

SQLite 與 MySQL schema 仍在 repository 中，但沒有納入本 fork 的正式環境驗證。
