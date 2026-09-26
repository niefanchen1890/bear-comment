import React, { useCallback, useState } from "react"
import { useMutation, useQuery } from "react-query"
import { useRouter } from "next/router"
import { AiOutlineSetting, AiOutlineFileText, AiOutlinePlus, AiOutlineComment, AiOutlineCode, AiOutlineRight, AiOutlineDown, AiOutlineQuestionCircle } from 'react-icons/ai'
import { signOut } from "next-auth/react"
import { Anchor, AppShell, Badge, Button, Code, Group, Header, Menu, Modal, Navbar, NavLink, Stack, Switch, Text, TextInput, Title } from "@mantine/core"
import Link from "next/link"
import type { ProjectServerSideProps } from "../pages/dashboard/project/[projectId]/settings"
import { modals } from "@mantine/modals"
import { useClipboard, useDisclosure } from '@mantine/hooks';
import { notifications } from "@mantine/notifications"
import { apiClient } from "../utils.client"
import { useForm } from "react-hook-form"
import { MainLayoutData } from "../service/viewData.service"
import { Head } from "./Head"

// From https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
function validateEmail(email) {
  if (email === '') {
    return true
  }
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const updateUserSettings = async (params: {
  notificationEmail?: string,
  enableNewCommentNotification?: boolean,
  displayName?: string,
}) => {
  const res = await apiClient.put(`/user`, {
    displayName: params.displayName,
    notificationEmail: params.notificationEmail,
    enableNewCommentNotification: params.enableNewCommentNotification,
  })
  return res.data
}

export function MainLayout(props: {
  children?: any,
  id: 'comments' | 'settings'
  project: ProjectServerSideProps,
} & MainLayoutData) {

  const router = useRouter()
  const clipboard = useClipboard()
  const [isUserPannelOpen, { open: openUserModal, close: closeUserModal }] = useDisclosure(false);

  const userSettingsForm = useForm({
    defaultValues: {
      username: props.userInfo.name,
      displayName: props.userInfo.displayName,
      email: props.userInfo.email,
      notificationEmail: props.userInfo.notificationEmail,
    },
  })

  const updateNewCommentNotification = useMutation(updateUserSettings, {
    onSuccess() {
      notifications.show({
        title: '成功',
        message: '使用者設定已更新',
        color: 'green'
      })
    },
    onError() {
      notifications.show({
        title: '錯誤',
        message: '發生錯誤，請稍後再試',
        color: 'red'
      })
    }
  })
  const updateUserSettingsMutation = useMutation(updateUserSettings, {
    onSuccess() {
      notifications.show({
        title: '成功',
        message: '使用者設定已更新',
        color: 'green'
      })
    },
    onError() {
      notifications.show({
        title: '錯誤',
        message: '發生錯誤，請稍後再試',
        color: 'red'
      })
    }
  })

  const onClickSaveUserSettings = async () => {
    const data = userSettingsForm.getValues()
    if (!validateEmail(data.notificationEmail)) {
      notifications.show({
        title: '電子郵件格式錯誤',
        message: '請輸入有效的電子郵件地址',
        color: 'red'
      })
      return
    }
    updateUserSettingsMutation.mutate({
      displayName: data.displayName,
      notificationEmail: data.notificationEmail,
    })
  }

  const projectId = router.query.projectId as string

  // should memo
  const ProjectMenu = React.useCallback(() => {
    return <Menu>
      <Menu.Target>
        <Button size='xs' variant={'light'} rightIcon={<AiOutlineDown />}>{props.project.title}</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Link href="/getting-start" style={{ textDecoration: 'none' }}>
          <Menu.Item icon={<AiOutlinePlus />}>
            新增網站
          </Menu.Item>
        </Link>
        <Menu.Divider />
        <Menu.Label>
          網站
        </Menu.Label>
        {props.projects.map(project => {
          return (
            <Menu.Item key={project.id} onClick={_ => {
              location.href = `/dashboard/project/${project.id}`
            }}>
              {project.title}
            </Menu.Item>
          )
        })}
      </Menu.Dropdown>
    </Menu>
  }, [props.project.id])

  const Menubar = React.useMemo(() => {
    const styles = {
      root: {
        borderRadius: 4
      },
      label: {
        fontWeight: 500 as any,
        color: '#343A40'
      },
      icon: {
        color: '#343A40'
      }
    }
    return (
      <Stack>
        <Stack spacing={8} p="sm">
          <Link href={`/dashboard/project/${projectId}`} style={{ textDecoration: 'none' }}>
            <NavLink active={props.id === "comments"} styles={styles} label="評論" icon={<AiOutlineComment />}>
            </NavLink>
          </Link>
          <Link href={`/dashboard/project/${projectId}/settings`} style={{ textDecoration: 'none' }}>
            <NavLink active={props.id === 'settings'} styles={styles} label="網站設定" icon={<AiOutlineSetting />}>
            </NavLink>
          </Link>
          <NavLink component="a" href="/doc" target={'_blank'} label="使用手冊" icon={<AiOutlineFileText />}>
          </NavLink>
        </Stack>

      </Stack>
    )
  }, [])

  const openEmbededCodeModal = React.useCallback(() => {
    const code = `<div id="cusdis_thread"
  data-host="${location.origin}"
  data-app-id="${props.project.id}"
  data-page-id="{{ PAGE_ID }}"
  data-page-url="{{ PAGE_URL }}"
  data-page-title="{{ PAGE_TITLE }}"
></div>
<script async defer src="${location.origin}/js/cusdis.es.js"></script>
`

    modals.openConfirmModal({
      title: "嵌入程式碼",
      closeOnConfirm: false,
      labels: {
        cancel: '取消',
        confirm: '複製'
      },
      onConfirm() {
        clipboard.copy(code)
        notifications.show({
          title: '已複製',
          message: '嵌入程式碼已複製'
        })
      },
      children: (
        <Stack>
          <Code block>
            {code}
          </Code>
          <Anchor size="sm" href="/doc#/advanced/sdk" target={'_blank'}>
            <Group spacing={4} align='center'>
              <AiOutlineQuestionCircle />
              瞭解更多
            </Group>
          </Anchor>
        </Stack>
      )
    })
  }, [])

  const badge = React.useMemo(() => (
    <Badge color="gray" size="xs">自託管</Badge>
  ), [])

  const header = React.useMemo(() => {
    return (
      <Group mx="md" sx={{
        height: '100%',
        justifyContent: 'space-between'
      }}>
        <Group>
          <Group>
            <Title order={3} style={{ fontWeight: 'bold' }}>
              <Anchor href="/">
                Bear Comment
              </Anchor>
            </Title>
            <ProjectMenu />
          </Group>
          <Group sx={{
            // height: '100%'
          }}>
            <Button leftIcon={<AiOutlineCode />} onClick={openEmbededCodeModal} size="xs" variant={'outline'}>
              嵌入程式碼
            </Button>
          </Group>
        </Group>
        <Group spacing={4}>
          <Button onClick={_ => {
            openUserModal()
          }} size="xs" rightIcon={<AiOutlineRight />} variant='subtle'>{props.session.user.name} {badge}</Button>
        </Group>
      </Group>
    )
  }, [])


  return (
    <>
      <Head title={`${props.project.title} - Bear Comment`} />
      <AppShell
        fixed={false}
        navbar={<Navbar sx={{
        }} width={{
          base: 240,
        }}>
          {Menubar}
        </Navbar>}
        header={
          <Header height={48}>
            {header}
          </Header>
        }
        styles={{
          body: {
            backgroundColor: '#f5f5f5',
          },
          main: {
            overflow: 'scroll'
          }
        }}
      >
        <Modal opened={isUserPannelOpen} size="lg" onClose={closeUserModal}
          title="使用者設定"
        >
          <Stack>
            <Stack spacing={8}>
              <Text weight={500} size="sm">使用者名稱</Text>
              <TextInput defaultValue={props.userInfo.name} size="sm" disabled />
            </Stack>
            <Stack spacing={8}>
              <Text weight={500} size="sm">登入電子郵件</Text>
              <TextInput defaultValue={props.userInfo.email} size="sm" disabled />
            </Stack>
            <Stack spacing={8}>
              <Text weight={500} size="sm">通知電子郵件</Text>
              <TextInput placeholder={props.userInfo.email} {...userSettingsForm.register("notificationEmail")} size="sm" />
              <Switch defaultChecked={props.userInfo.enableNewCommentNotification} onChange={e => {
                updateNewCommentNotification.mutate({
                  enableNewCommentNotification: e.target.checked
                })
              }} label="啟用通知" />
            </Stack>
            <Stack spacing={8}>
              <Text weight={500} size="sm">顯示名稱</Text>
              <TextInput placeholder={props.userInfo.name} {...userSettingsForm.register("displayName")} size="sm" />
            </Stack>
            <Button loading={updateUserSettingsMutation.isLoading} onClick={onClickSaveUserSettings}>儲存</Button>
            <Button onClick={_ => signOut()} variant={'outline'} color='red'>
              登出
            </Button>
          </Stack>
        </Modal>
        {props.children}
      </AppShell>
    </>
  )
}
