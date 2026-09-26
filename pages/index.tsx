import React from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { Box, Button, Container, Grid, Group, Stack, Text, Title } from '@mantine/core'
import { AiOutlineArrowRight, AiOutlineBell, AiOutlineCloudServer, AiOutlineComment, AiOutlineSafety } from 'react-icons/ai'
import { Footer } from '../components/Footer'
import { Head } from '../components/Head'
import { getSession } from '../utils.server'
import { UserSession } from '../service'

type Props = { session: UserSession | null }

const features = [
  { title: '匿名評論', description: '訪客無須註冊或登入即可留言，管理員可在後台審核、回覆與刪除評論。', icon: <AiOutlineComment size={28} /> },
  { title: '自行托管', description: '應用程式與 PostgreSQL 資料庫都運行在自己的伺服器，評論資料由站主掌控。', icon: <AiOutlineCloudServer size={28} /> },
  { title: '重視隱私', description: '不加入廣告追蹤器，也不將訪客評論傳送給第三方評論平台。', icon: <AiOutlineSafety size={28} /> },
  { title: '通知與 Webhook', description: '新評論可透過電子郵件或 Webhook 通知管理員，並可串接 Telegram Bot。', icon: <AiOutlineBell size={28} /> },
]

export default function IndexPage({ session }: Props) {
  const router = useRouter()
  const openDashboard = () => session
    ? router.push('/dashboard')
    : signIn(undefined, { callbackUrl: `${location.origin}/dashboard` })

  return (
    <Box>
      <Head title="Bear Comment｜輕量、重視隱私的開源評論系統" />
      <Container py={96}>
        <Stack spacing={72}>
          <Stack spacing={28} align="flex-start">
            <Text color="blue" weight={700}>BEAR COMMENT</Text>
            <Title order={1} sx={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', lineHeight: 1.08 }}>一個輕量、重視隱私的開源評論系統</Title>
            <Text color="gray.700" size="lg" maw={780}>
              <strong>Bear Comment</strong> 是一個開源、輕量、重視隱私的 <strong>Disqus 替代方案</strong>。
              它容易使用，也能輕鬆整合至現有網站。我們不追蹤你或你的訪客。
            </Text>
            <Group>
              <Button rightIcon={<AiOutlineArrowRight />} onClick={openDashboard}>{session ? '進入管理後台' : '管理員登入'}</Button>
              <Button variant="outline" component="a" href="/doc">使用手冊</Button>
            </Group>
          </Stack>
          <Box>
            <Title order={2} mb={28}>為自託管網站而維護</Title>
            <Grid gutter="xl">
              {features.map((feature) => (
                <Grid.Col key={feature.title} xs={12} md={6}>
                  <Stack spacing={10} p="lg" sx={{ border: '1px solid #e9ecef', borderRadius: 12, height: '100%' }}>
                    <Text color="blue">{feature.icon}</Text><Title order={3}>{feature.title}</Title><Text color="gray.700">{feature.description}</Text>
                  </Stack>
                </Grid.Col>
              ))}
            </Grid>
          </Box>
          <Box p="xl" sx={{ background: '#f8f9fa', borderRadius: 12 }}>
            <Title order={2} mb="sm">Hugo + PaperMod</Title>
            <Text color="gray.700">Hugo 網站透過 Bear Comment widget 連接至自託管伺服器，評論寫入自己的 PostgreSQL 資料庫。嵌入方式與現有 Cusdis 介面相容。</Text>
          </Box>
        </Stack>
      </Container>
      <Footer />
    </Box>
  )
}

export async function getServerSideProps(ctx) {
  return { props: { session: await getSession(ctx.req) } }
}
