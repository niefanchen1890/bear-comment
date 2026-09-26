import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { Head } from '../components/Head'

function ForbiddenPage() {
  return (
    <>
      <Head title="無權存取 - Bear Comment" />
      <Container py={96}><Stack><Title>無權存取</Title><Text color="gray">你沒有權限查看此頁面。</Text><Button component="a" href="/dashboard">返回管理後台</Button></Stack></Container>
    </>
  )
}

export async function getServerSideProps(ctx) {
  return {
    props: {
      
    }
  }
}

export default ForbiddenPage
