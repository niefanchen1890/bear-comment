import { NextApiRequest, NextApiResponse } from 'next'
import { UserService } from '../../../service/user.service'
import {
  SecretKey,
  TokenBody,
  TokenService,
  UnSubscribeType,
} from '../../../service/token.service'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const userService = new UserService(req)
  const tokenService = new TokenService()

  if (req.method === 'GET') {
    const { token } = req.query as {
      token?: string
    }

    if (!token) {
      res.send('Invalid token')
      return
    }

    try {
      const result = tokenService.validate(
        token,
        SecretKey.Unsubscribe,
      ) as TokenBody.UnsubscribeNewComment

      switch (result.type) {
        case UnSubscribeType.NEW_COMMENT:
          {
            await userService.update(result.userId, {
              enableNewCommentNotification: false,
            })
          }
          break
      }

      res.send('Unsubscribe!')
      return
    } catch (e) {
      res.send('Invalid token')
      return
    }
  }

  res.setHeader('Allow', ['GET'])
  res.status(405).json({ message: 'Method not allowed' })
}
