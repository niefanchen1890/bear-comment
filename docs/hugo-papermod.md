# Hugo + PaperMod 整合

## 資料流

```text
Hugo/PaperMod 頁面
  ↓ 載入公開 JavaScript
https://comments.example.com/js/cusdis.es.js
  ↓ GET/POST 公開 API
自託管 Bear Comment
  ↓ Prisma
自託管 PostgreSQL
```

不需要 `cusdis.com` Hosted Service。評論資料由自己的 VPS 和 PostgreSQL 控制。

## 1. Hugo 設定

在 `hugo.yaml` 加入：

```yaml
params:
  comments: true
  cusdis:
    host: https://comments.example.com
    appId: replace-with-project-id
    lang: zh-tw
```

`appId` 可在 Bear Comment dashboard 的專案設定取得。它是公開識別碼，不是 secret。

## 2. PaperMod partial

建立 `layouts/partials/comments.html`：

```html
{{- $cusdis := site.Params.cusdis -}}
{{- if and $cusdis $cusdis.host $cusdis.appId -}}
<section class="cusdis-comments" aria-labelledby="cusdis-heading">
  <h2 id="cusdis-heading">評論</h2>
  <div
    id="cusdis_thread"
    data-host="{{ strings.TrimRight "/" $cusdis.host }}"
    data-app-id="{{ $cusdis.appId }}"
    data-page-id="{{ .RelPermalink }}"
    data-page-url="{{ .Permalink }}"
    data-page-title="{{ .Title }}"
    data-theme="auto"
    data-lang="{{ $cusdis.lang | default "zh-tw" }}"
  >評論載入中…</div>
  <noscript>請啟用 JavaScript 以查看和發表評論。</noscript>
</section>

<script defer src="{{ strings.TrimRight "/" $cusdis.host }}/js/widget/lang/{{ $cusdis.lang | default "zh-tw" }}.js"></script>
<script id="cusdis-script" defer src="{{ strings.TrimRight "/" $cusdis.host }}/js/cusdis.es.js"></script>
<script>
  (() => {
    const syncCusdisTheme = () => {
      if (window.CUSDIS && window.CUSDIS.setTheme) {
        window.CUSDIS.setTheme(
          document.body.classList.contains("dark") ? "dark" : "light"
        );
      }
    };
    document.getElementById("cusdis-script")?.addEventListener("load", syncCusdisTheme);
    new MutationObserver(syncCusdisTheme).observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });
  })();
</script>
{{- end -}}
```

語言檔必須在 widget 前載入。兩個 script 都使用 `defer`；不要加入 `async`，否則 widget
可能先執行並退回英文。

## 3. PaperMod 顯示條件

PaperMod 的 `single.html` 會在 `.Param "comments"` 為 true 時呼叫
`comments.html`。site-level `params.comments: true` 會為文章預設啟用；單篇文章可在
front matter 覆寫：

```yaml
comments: false
```

list page、home page 或自訂 layout 是否顯示，取決於該 layout 有沒有呼叫 partial。

## 4. 穩定的 page ID

本設定使用 `.RelPermalink` 作為 `data-page-id`。它是 PostgreSQL 中判斷評論屬於哪一頁的
key。更改文章 URL 時，舊評論不會自動移到新 page ID；應避免任意更改 permalink，或在
資料庫中安排明確 migration。

## 5. CORS

Bear Comment `.env` 必須列出正式 Hugo origins：

```dotenv
CORS_ORIGINS=https://example.com,https://www.example.com
```

開發環境可另加 `http://localhost:1313`，正式環境不應保留不需要的 origin。

`/api/open/comments` 只接受 allowlist origin。`/js/*` 是讓不同網站載入的公開 widget
靜態資源，因此回傳 `Access-Control-Allow-Origin: *`；這不會放寬評論 API。

## 6. 匿名評論流程

1. 訪客輸入必填暱稱、選填 email 與評論內容。
2. Widget POST 至 `/api/open/comments`。
3. PostgreSQL 建立 `approved=false` 的評論。
4. Email/Webhook/Telegram 通知（如已配置）。
5. 管理員在 dashboard 或三天有效審核連結批准。
6. Widget 只公開顯示已批准且未刪除的評論。

## 7. 驗證

```sh
hugo --minify --destination /tmp/hugo-check
rg 'cusdis_thread|comments.example.com|replace-with-project-id' \
  /tmp/hugo-check/path/to/page/index.html
curl --fail https://comments.example.com/api/health
```

再以全新瀏覽器 profile 或無痕視窗實際檢查：表單可見、語言正確、明暗主題切換、提交後
保持待審核、批准後顯示。
