import { Text } from '@mantine/core'

export enum ErrorCode {
  INVALID_TOKEN = 'INVALID_TOKEN'
}

function ErrorPage({
  errorCode
}: {
  errorCode: ErrorCode | null
}) {

  const info = (() => {
    switch (errorCode) {
      case ErrorCode.INVALID_TOKEN:
        return <Text>連結已失效或無效。</Text>
      default:
        return <Text>發生錯誤，請稍後再試。</Text>
    }
  })()

  return (
    <>
      {info}
    </>
  )
}

export async function getServerSideProps(ctx) {
  return {
    props: {
      errorCode: ctx.query.code || null
    }
  }
}

export default ErrorPage
