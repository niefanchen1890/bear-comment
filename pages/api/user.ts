import { NextApiRequest, NextApiResponse } from "next";
import { AuthService } from "../../service/auth.service";
import { UserService } from "../../service/user.service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const userService = new UserService(req)
  const authService = new AuthService(req, res)

  if (req.method === 'PUT') {
    const {
      notificationEmail,
      enableNewCommentNotification,
      displayName
    } = req.body as {
      notificationEmail?: string
      enableNewCommentNotification?: boolean,
      displayName?: string
    }

    const user = await authService.authGuard()

    if (!user) {
      return
    }

    if (
      notificationEmail !== undefined &&
      (typeof notificationEmail !== 'string' ||
        notificationEmail.length > 254 ||
        (notificationEmail !== '' &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)))
    ) {
      res.status(400).json({ message: 'notificationEmail is invalid' })
      return
    }
    if (
      displayName !== undefined &&
      (typeof displayName !== 'string' || displayName.trim().length > 80)
    ) {
      res.status(400).json({ message: 'displayName is invalid' })
      return
    }
    if (
      enableNewCommentNotification !== undefined &&
      typeof enableNewCommentNotification !== 'boolean'
    ) {
      res.status(400).json({ message: 'enableNewCommentNotification must be a boolean' })
      return
    }

    await userService.update(user.uid, {
      enableNewCommentNotification,
      notificationEmail: notificationEmail?.trim(),
      displayName: displayName?.trim()
    })

    res.json({
      message: 'success'
    })
    return
  }

  res.setHeader('Allow', ['PUT'])
  res.status(405).json({ message: 'Method not allowed' })
}
