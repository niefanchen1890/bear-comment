import { Container, TypographyStylesProvider } from '@mantine/core'
import { Footer } from '../components/Footer'
import { Head } from '../components/Head'

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head title="隱私說明 - Bear Comment" />
      <Container py={48} size="md">
        <TypographyStylesProvider>
          <h1>Bear Comment 隱私說明</h1>
          <p>本說明適用於由 Fr Patrick Lim 自行托管的 Bear Comment 評論服務。本服務用於為自有網站提供匿名評論、審核與管理功能。</p>

          <h2>收集的資料</h2>
          <p>訪客送出評論時，服務會儲存訪客填寫的暱稱、評論內容、選填的電子郵件地址，以及評論所屬頁面的標題、URL 與識別碼。伺服器也可能在安全與錯誤日誌中短期處理 IP 位址、瀏覽器類型及請求時間。</p>
          <p>訪客不需建立帳號。電子郵件為選填，僅在訪客要求接收回覆通知時使用。</p>

          <h2>資料用途</h2>
          <ul>
            <li>顯示、審核、回覆或刪除評論。</li>
            <li>防止垃圾評論、濫用與過於頻繁的請求。</li>
            <li>在已啟用的情況下，向管理員發送電子郵件、Webhook 或 Telegram 新評論通知。</li>
            <li>在訪客主動選擇時，發送評論回覆通知。</li>
          </ul>

          <h2>資料儲存與第三方</h2>
          <p>評論與管理資料儲存於自行管理的 PostgreSQL 資料庫。Bear Comment 不使用廣告追蹤器，也不販售評論資料。</p>
          <p>若站主啟用 Telegram、電子郵件或通用 Webhook 通知，通知所需的評論資訊會傳送給對應服務。這些服務會依其自身隱私政策處理資料。</p>

          <h2>保留、更正與刪除</h2>
          <p>評論會保留至站主或評論者要求刪除，或服務停止運作為止。如需查詢、更正或刪除與自己有關的評論資料，請透過嵌入本評論系統的網站所提供的聯絡方式與站主聯絡，並提供評論所在頁面及可用於識別該評論的資訊。</p>

          <h2>開源與授權</h2>
          <p>Bear Comment 基於 Cusdis（原作者 Randy Lu / djyde）修改，依 GNU GPLv3 授權。本維護版由 Fr Patrick Lim 修改，使用 OpenAI Codex 協助。</p>
          <p>最後更新：2026 年 9 月 26 日。</p>
        </TypographyStylesProvider>
      </Container>
      <Footer />
    </>
  )
}
