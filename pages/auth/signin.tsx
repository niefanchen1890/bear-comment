import { Alert, Box, Button, Container, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { getProviders, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import React, { FormEvent, useState } from 'react'
import { Head } from '../../components/Head'

export default function SignInPage({ providers }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const callbackUrl = typeof router.query.callbackUrl === 'string' ? router.query.callbackUrl : '/dashboard'
  const credentialsProvider = providers?.credentials
  const oauthProviders = Object.values(providers || {}).filter((provider: any) => provider.id !== 'credentials') as any[]

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { username, password, callbackUrl, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('使用者名稱或密碼不正確，或登入嘗試過於頻繁。')
      return
    }
    router.push(result?.url || callbackUrl)
  }

  return (
    <>
      <Head title="管理員登入 - Bear Comment" />
      <Container size={420} py={96}>
        <Stack spacing="lg">
          <Box><Text color="blue" weight={700}>BEAR COMMENT</Text><Title order={1} mt={6}>管理員登入</Title></Box>
          {router.query.error && <Alert color="red">無法登入，請檢查帳號或登入提供者設定。</Alert>}
          {error && <Alert color="red">{error}</Alert>}
          {credentialsProvider && (
            <form onSubmit={submit}>
              <Stack>
                <TextInput label="使用者名稱" value={username} onChange={(event) => setUsername(event.currentTarget.value)} required autoComplete="username" />
                <PasswordInput label="密碼" value={password} onChange={(event) => setPassword(event.currentTarget.value)} required autoComplete="current-password" />
                <Button type="submit" loading={loading}>登入</Button>
              </Stack>
            </form>
          )}
          {oauthProviders.map((provider) => (
            <Button key={provider.id} variant="outline" onClick={() => signIn(provider.id, { callbackUrl })}>使用 {provider.name} 登入</Button>
          ))}
          <Button component="a" href="/" variant="subtle">返回首頁</Button>
        </Stack>
      </Container>
    </>
  )
}

export async function getServerSideProps() {
  return { props: { providers: await getProviders() } }
}
