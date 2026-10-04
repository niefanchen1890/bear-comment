# Bear Comment Widget

這是 Bear Comment 的嵌入式評論 widget。對外仍保留 `cusdis_thread`、
`window.CUSDIS` 與 `cusdis.es.js` 等名稱，以相容現有 Cusdis 嵌入程式碼。

使用方式見專案的 [Hugo + PaperMod 手冊](../docs/hugo-papermod.md)。

設定 `data-theme="auto"` 後，widget 會跟隨宿主頁面的
`<html data-theme="dark|light">`、常見 `.dark` class 或系統
`prefers-color-scheme`。
