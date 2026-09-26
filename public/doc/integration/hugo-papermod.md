# Hugo + PaperMod

在 `hugo.yaml` 設定：

```yaml
params:
  comments: true
  cusdis:
    host: https://comments.example.com
    appId: replace-with-project-id
    lang: zh-tw
```

在 `layouts/partials/comments.html` 加入：

```html
<div
  id="cusdis_thread"
  data-host="{{ site.Params.cusdis.host }}"
  data-app-id="{{ site.Params.cusdis.appId }}"
  data-page-id="{{ .RelPermalink }}"
  data-page-url="{{ .Permalink }}"
  data-page-title="{{ .Title }}"
  data-theme="auto"
></div>
<script defer src="{{ site.Params.cusdis.host }}/js/widget/lang/{{ site.Params.cusdis.lang }}.js"></script>
<script defer src="{{ site.Params.cusdis.host }}/js/cusdis.es.js"></script>
```

語言檔必須先載入，兩個 script 都用 `defer`，不要加入 `async`。

Bear Comment `.env` 必須允許 Hugo origins：

```dotenv
CORS_ORIGINS=https://example.com,https://www.example.com
```

`.RelPermalink` 是評論頁面的穩定 ID。更改文章 permalink 會產生新的評論頁面紀錄。
