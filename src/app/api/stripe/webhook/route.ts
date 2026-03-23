import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import Stripe from 'stripe'

const USE_MOCKS = process.env.USE_MOCKS === 'true'

export async function POST(request: NextRequest) {
  if (USE_MOCKS) {
    return NextResponse.json({ received: true })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: '署名がありません' }, { status: 400 })
    }

    const stripe = getStripe()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('チェックアウト完了:', session.id)
        // TODO: subscriptionsテーブルを更新
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('サブスクリプション更新:', subscription.id)
        // TODO: subscriptionsテーブルを更新
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('サブスクリプション削除:', subscription.id)
        // TODO: subscriptionsテーブルを更新
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe Webhookエラー:', error)
    return NextResponse.json({ error: 'Webhook処理に失敗しました' }, { status: 500 })
  }
}
