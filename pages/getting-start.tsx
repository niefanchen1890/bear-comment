import { Box, Container, Stack, Title, Text, Button, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import router from "next/router"
import React from "react"
import { useMutation } from "react-query"
import { Head } from "../components/Head"
import { ProjectService } from "../service/project.service"
import { apiClient } from "../utils.client"
import { getSession } from "../utils.server"

export const createProject = async (body: { title: string }) => {
  const res = await apiClient.post("/projects", {
    title: body.title,
  })
  return res.data
}

function GettingStart() {
  const createProjectMutation = useMutation(createProject)
  const titleInputRef = React.useRef<HTMLInputElement>(null)


  async function onClickCreateProject() {
    if (!titleInputRef.current.value) {
      return
    }

    await createProjectMutation.mutate(
      {
        title: titleInputRef.current.value,
      },
      {
        onSuccess(data) {
          notifications.show({
            title: "網站已建立",
            message: "正在前往網站管理後台",
            color: 'green'
          })
          router.push(`/dashboard/project/${data.data.id}`, null, {
            shallow: true,
          })
        },
        onError(data: any) {
          const {
            error: message,
            status: statusCode
          } = data.response.data

          notifications.show({
            title: "錯誤",
            message,
            color: 'yellow'
          })
        }
      }
    )
  }

  return (
    <>
      <Head title="新增網站 - Bear Comment" />
      <Container mt={120}>

        <Stack>
          <Stack spacing={4}>
            <Title order={2} weight={500}>
              建立新網站
            </Title>
            <Text color="gray">
              為網站輸入名稱，即可開始使用 Bear Comment。
            </Text>
          </Stack>

          <Stack spacing={8}>
            <Text>
              網站名稱
            </Text>
            <TextInput placeholder="我的個人部落格" ref={titleInputRef} />
          </Stack>

          <Box>
            <Button onClick={_ => void onClickCreateProject()} loading={createProjectMutation.isLoading} color="blue">建立</Button>
          </Box>
        </Stack>
      </Container>
    </>
  )
}

export async function getServerSideProps(ctx) {

  const session = await getSession(ctx.req)

  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false
      }
    }
  }

  // const projectService = new ProjectService(ctx.req)

  // const defaultProject = await projectService.getFirstProject(session.uid, {
  //   select: {
  //     id: true
  //   }
  // })

  // if (defaultProject) {
  //   // redirect to project dashboard
  //   return {
  //     redirect: {
  //       destination: `/dashboard/project/${defaultProject.id}`,
  //       permanent: false
  //     }
  //   }
  // }

  return {
    props: {

    }
  }
}

export default GettingStart
