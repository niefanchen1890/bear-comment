import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { Head } from '../components/Head'

function NotFoundPage() {
  return (
    <>
      <Head title="找不到頁面 - Bear Comment" />
      <Container py={96}><Stack><Title>找不到頁面</Title><Text color="gray">你要查看的頁面不存在或已被移除。</Text><Button component="a" href="/">返回首頁</Button></Stack></Container>
    </>
  )
}


export default NotFoundPage
