import { Box, Button, Center, Container, createStyles, Divider, Grid, Group, List, Stack, Switch, Text, TextInput, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { Project } from "@prisma/client"
import { useRouter } from "next/router"
import React from "react"
import { useForm } from "react-hook-form"
import { useMutation } from "react-query"
import {  MainLayout } from "../../../../components/Layout"
import { ProjectService } from "../../../../service/project.service"
import { MainLayoutData, ViewDataService } from "../../../../service/viewData.service"
import { apiClient } from "../../../../utils.client"
import { getSession, resolvedConfig } from "../../../../utils.server"

const deleteProject = async ({ projectId }) => {
  const res = await apiClient.delete<{
    data: string
  }>(`/project/${projectId}`)
  return res.data.data
}

const updateProjectSettings = async ({ projectId, body }) => {
  const res = await apiClient.put(`/project/${projectId}`, body)
  return res.data
}

const useListStyle = createStyles(theme => ({
  container: {
    border: `1px solid #eee`,
  },
  item: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: theme.spacing.md,
    ':not(:last-child)': {
      borderBottom: '1px solid #eee'
    }
  },
  label: {
    fontWeight: 500 as any,
    fontSize: 14
  }
}))

export type ProjectServerSideProps = Pick<Project, 'ownerId' | 'id' | 'title' | 'token' | 'enableNotification' | 'webhook' | 'enableWebhook'>

export default function Page(props: {
  session: any,
  project: ProjectServerSideProps,
  mainLayoutData: MainLayoutData
}) {
  const { classes: listClasses } = useListStyle()

  const router = useRouter()
  const projectId = router.query.projectId as string

  const successCallback = React.useCallback(() => {
    notifications.show({
      title: '已儲存',
      message: '設定已儲存',
      color: 'green'
    })
  }, [])
  const failCallback = React.useCallback(() => {
    notifications.show({
      title: '儲存失敗',
      message: '發生錯誤，請稍後再試',
      color: 'red'
    })
  }, [])

  const enableNotificationMutation = useMutation(updateProjectSettings, {
    onSuccess: successCallback,
    onError: failCallback
  })
  const enableWebhookMutation = useMutation(updateProjectSettings, {
    onSuccess: successCallback,
    onError: failCallback
  })
  const updateWebhookUrlMutation = useMutation(updateProjectSettings, {
    onSuccess: successCallback,
    onError: failCallback
  })
  const webhookInputRef = React.useRef<HTMLInputElement>(null)

  const deleteProjectMutation = useMutation(deleteProject, {
    onSuccess() {
      location.href = "/dashboard"
    },
    onError: failCallback 
  })

  const onSaveWebhookUrl = async _ => {
    const value = webhookInputRef.current.value

    const validUrlRegexp = /^https?:/

    if (!validUrlRegexp.exec(value)) {
      notifications.show({
        title: 'URL 格式錯誤',
        message: '請輸入有效的 http/https URL',
        color: 'red'
      })
      return
    }

    updateWebhookUrlMutation.mutate({
      projectId,
      body: {
        webhookUrl: value
      }
    })
  }

  return (
    <MainLayout id="settings" project={props.project} {...props.mainLayoutData}>
      <Container sx={{
        marginTop: 24
      }}>
        <Title sx={{
          marginBottom: 12
        }} order={3}>網站設定</Title>
        <Stack className={listClasses.container} spacing={0}>
          <Box className={listClasses.item}>
            <Group>
              <Text className={listClasses.label}>
                電子郵件通知
              </Text>
              <Switch defaultChecked={props.project.enableNotification} onChange={e => {
                enableNotificationMutation.mutate({
                  projectId: router.query.projectId,
                  body: {
                    enableNotification: e.target.checked
                  }
                })
              }} />
            </Group>
          </Box>
          <Box className={listClasses.item}>
            <Stack>
              <Group>
                <Text className={listClasses.label}>
                  Webhook
                </Text>
                <Switch defaultChecked={props.project.enableWebhook} onChange={e => {
                  enableWebhookMutation.mutate({
                    projectId: router.query.projectId,
                    body: {
                      enableWebhook: e.target.checked
                    }
                  })
                }} />
              </Group>
              <Group grow>
                <TextInput defaultValue={props.project.webhook} ref={webhookInputRef} placeholder="https://..." />
                <Box>
                  <Button onClick={onSaveWebhookUrl}>儲存</Button>
                </Box>
              </Group>
            </Stack>
          </Box>
          <Box className={listClasses.item}>
            <Stack>
              <Group>
                <Text className={listClasses.label}>
                  危險區域
                </Text>
              </Group>
              <Box>
                <Stack align={'start'}>
                  <Button onClick={_ => {
                    if (window.confirm("確定要刪除這個網站及其評論嗎？此操作無法復原。")) {
                      deleteProjectMutation.mutate({
                        projectId
                      })
                    }
                  }} loading={deleteProjectMutation.isLoading} color="red">刪除網站</Button>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Container>


    </MainLayout >
  )
}
export async function getServerSideProps(ctx) {
  const projectService = new ProjectService(ctx.req)
  const viewDataService = new ViewDataService(ctx.req)

  const session = await getSession(ctx.req)

  if (!session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false
      }
    }
  }

  const project = await projectService.get(ctx.query.projectId) as Project

  if (project.deletedAt) {
    return {
      redirect: {
        destination: '/404',
        permanent: false
      }
    }
  }

  if (session && (project.ownerId !== session.uid)) {
    return {
      redirect: {
        destination: '/forbidden',
        permanent: false
      }
    }
  }

  

  return {
    props: {
      mainLayoutData: await viewDataService.fetchMainLayoutData(),
      project: {
        id: project.id,
        title: project.title,
        ownerId: project.ownerId,
        token: project.token,
        enableNotification: project.enableNotification,
        enableWebhook: project.enableWebhook,
        webhook: project.webhook
      }
    }
  }
}
