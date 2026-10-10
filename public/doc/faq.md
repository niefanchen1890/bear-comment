# 常見問題

## 訪客需要註冊嗎？

不需要。暱稱與內容必填，email 選填。

## 為什麼送出後看不到評論？

新評論應在提交成功後立即顯示。若沒有顯示，請重新整理頁面並檢查評論 API、CORS 與
瀏覽器 console；管理員刪除的評論不會再公開顯示。

## 評論儲存在哪裡？

儲存在自己的 PostgreSQL。Docker 部署使用 named volume；應另外建立 logical backups。

## 是否依賴 cusdis.com？

不依賴。Widget、API、dashboard 和 database 都由自己的 Bear Comment 服務提供。

## 為什麼只看到「評論」標題？

檢查 `/js/iframe.umd.js` 是否回傳 `Access-Control-Allow-Origin: *`，以及
`/api/open/comments` 是否接受分鐘制 timezone offset（UTC+8 為 `480`）。

## 為什麼表單是英文？

必須在 widget 前以 `defer` 載入 `/js/widget/lang/zh-tw.js`，不要加入 `async`。

## 修改 `.env` 後為何沒有生效？

Compose environment 在建立 container 時注入。執行：

```sh
docker compose up -d --force-recreate app
```

## 如何備份？

使用 `pg_dump -Fc`，不要直接複製正在運行的 PostgreSQL data directory。
