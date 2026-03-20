import { NextRequest, NextResponse } from 'next/server'
import { validateLineSignature } from '@/lib/line/validate'
import { handleMessageEvent, handleFollowEvent } from '@/lib/line/handlers'
import { LineWebhookBody } from '@/types/line'

// Vercel Serverless Function のタイムアウトを60秒に延長
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    console.log('LINE Webhook received, body length:', body.length)

    // 署名検証
    const signature = request.headers.get('x-line-signature')
    if (!signature) {
      console.error('x-line-signature header missing')
      return NextResponse.json({ error: '署名がありません' }, { status: 401 })
    }

    if (!validateLineSignature(body, signature)) {
      return NextResponse.json({ error: '不正な署名' }, { status: 401 })
    }

    const webhookBody: LineWebhookBody = JSON.parse(body)
    console.log('LINE events count:', webhookBody.events.length)

    // Vercelではレスポンス後の非同期処理が実行されないため、同期的に処理
    for (const event of webhookBody.events) {
      console.log('Processing event:', event.type, 'from:', event.source?.userId)
      try {
        switch (event.type) {
          case 'message':
            await handleMessageEvent(event)
            break
          case 'follow':
            await handleFollowEvent(event)
            break
          case 'unfollow':
            console.log('ユーザーがブロック/削除:', event.source.userId)
            break
        }
      } catch (err) {
        console.error('イベント処理エラー:', event.type, err)
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook受信エラー:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
