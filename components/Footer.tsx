import { Anchor, Box, Center, Stack, Text } from '@mantine/core'
import * as React from 'react'
import { VERSION } from '../utils.client'

export function Footer() {
  return (
    <Box component="footer" px="md" py={48} sx={{ borderTop: '1px solid #e9ecef' }}>
      <Center><Stack spacing={6} align="center">
        <Text weight={600}>Bear Comment</Text>
        <Text size="sm" color="gray.600" align="center">基於 <Anchor href="https://github.com/djyde/cusdis" target="_blank" rel="noreferrer">Cusdis</Anchor>（原作者 Randy Lu / djyde）修改，依 <Anchor href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noreferrer">GNU GPLv3</Anchor> 授權。</Text>
        <Text size="sm" color="gray.600" align="center">本維護版由 Fr Patrick Lim 修改，使用 OpenAI Codex 協助。</Text>
        <Text size="xs" color="gray.500"><Anchor href="/privacy-policy">隱私說明</Anchor> · <Anchor href="/doc">使用手冊</Anchor> · v{VERSION}</Text>
      </Stack></Center>
    </Box>
  )
}
