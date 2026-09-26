import * as React from 'react'
import NextHead from 'next/head'

export function Head(props: {
  title: string
}) {
  return (
    <>
      <NextHead>
        <meta name="title" content="Bear Comment｜輕量、重視隱私的開源評論系統" />
        <meta name="description" content="Bear Comment 是一個開源、輕量、重視隱私的 Disqus 替代方案，可自行托管並整合至現有網站。" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Bear Comment｜輕量、重視隱私的開源評論系統" />
        <meta property="og:description" content="自行托管、不追蹤訪客的開源評論系統。" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Bear Comment｜輕量、重視隱私的開源評論系統" />
        <meta property="twitter:description" content="自行托管、不追蹤訪客的開源評論系統。" />
        <title>
          {props.title}
        </title>
      </NextHead>
    </>
  )
}
