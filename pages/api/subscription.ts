import axios from 'axios';
import * as crypto from 'crypto'
import { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';
import { SubscriptionService } from '../../service/subscription.service';
import { getSession, prisma, resolvedConfig } from '../../utils.server';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Get raw body as string
async function getRawBody(readable: Readable): Promise<Buffer> {
  const chunks = [];
  let total = 0
  for await (const chunk of readable) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    total += buffer.length
    if (total > 1024 * 1024) {
      throw new Error('Request body is too large')
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (!resolvedConfig.checkout.enabled) {
    res.status(404).json({ message: 'Subscription features are disabled' })
    return
  }

  if (req.method === 'POST') {
    let rawBody: Buffer
    try {
      rawBody = await getRawBody(req)
    } catch (error) {
      res.status(413).json({ message: 'Request body is too large' })
      return
    }
    const secret = resolvedConfig.checkout.lemonSecret;
    const signatureHeader = req.headers['x-signature']
    if (!secret || typeof signatureHeader !== 'string') {
      res.status(401).send('Invalid signature')
      return
    }
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signature = Buffer.from(signatureHeader, 'utf8');

    if (
      digest.length !== signature.length ||
      !crypto.timingSafeEqual(digest, signature)
    ) {
      res.status(401).send('Invalid signature');
      return
    }

    const data = JSON.parse(Buffer.from(rawBody).toString('utf8'));
    const subscriptionService = new SubscriptionService()
    const eventName = req.headers['x-event-name'] as string

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated': {
        await subscriptionService.update(data)
        break
      }
    }

    res.json({

    })
  } else if (req.method === 'DELETE') {
    const session = await getSession(req)

    if (!session) {
      res.status(401).send('Unauthorized')
      return
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        userId: session.uid
      },
    })

    if (!subscription) {
      res.status(404).send('Subscription not found')
      return
    }

    try {
      await axios.delete(`https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemonSubscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${resolvedConfig.checkout.lemonApiKey}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': "application/vnd.api+json"
        }
      })
    } catch (e) {
      res.status(502).json({ message: 'Unable to update the subscription provider' })
      return
    }

    res.json({
      message: 'success'
    })
  } else {
    res.setHeader('Allow', ['POST', 'DELETE'])
    res.status(405).json({ message: 'Method not allowed' })
  }
}
