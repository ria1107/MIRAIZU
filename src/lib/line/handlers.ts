import { getLineClient } from './client'
import { analyzeReceipt } from '@/lib/ai/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { LineWebhookEvent } from '@/types/line'
import { formatCurrency } from '@/lib/utils/format'

export async function handleMessageEvent(event: LineWebhookEvent) {
  if (!event.message || !event.replyToken) return
  const { message, source, replyToken } = event

  if (message.type === 'image') {
    await handleImageMessage(message.id, source.userId!, replyToken)
  } else if (message.type === 'text') {
    await replyText(replyToken, 'AI財務サポーターです。領収書の画像を送信してください。')
  }
}

async function handleImageMessage(messageId: string, lineUserId: string, replyToken: string) {
  try {
    console.log('画像処理開始:', { messageId, lineUserId })

    // 1. LINEから画像を取得（fetch APIで直接取得）
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    console.log('LINE画像取得中...')
    const imageResponse = await fetch(
      `https://api-data.line.me/v2/bot/message/${messageId}/content`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!imageResponse.ok) {
      console.error('LINE画像取得失敗:', imageResponse.status, await imageResponse.text())
      await replyText(replyToken, '画像の取得に失敗しました。もう一度お試しください。')
      return
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const imageBase64 = imageBuffer.toString('base64')
    console.log('LINE画像取得成功, サイズ:', imageBuffer.length)

    // 2. LINE連携を確認
    const supabase = createAdminClient()
    const { data: connection, error: connError } = await supabase
      .from('line_connections')
      .select('user_id')
      .eq('line_user_id', lineUserId)
      .single()

    if (connError || !connection) {
      console.error('LINE連携未登録:', lineUserId, connError)
      await replyText(replyToken, 'アカウントが連携されていません。Webアプリからアカウント連携を行ってください。')
      return
    }
    console.log('LINE連携確認OK, user_id:', connection.user_id)

    // 3. DBにレコード作成
    const { data: receipt, error: insertError } = await supabase
      .from('receipts')
      .insert({
        user_id: connection.user_id,
        status: 'processing' as const,
        receipt_type: 'expense' as const,
        line_message_id: messageId,
        source: 'line',
        file_name: `line_${messageId}.jpg`,
        mime_type: 'image/jpeg',
      })
      .select()
      .single()

    if (insertError || !receipt) {
      console.error('DB挿入エラー:', insertError)
      await replyText(replyToken, 'データの保存に失敗しました。')
      return
    }
    console.log('DBレコード作成:', receipt.id)

    // 4. AI解析
    console.log('AI解析開始...')
    const analysis = await analyzeReceipt(imageBase64)
    console.log('AI解析結果:', JSON.stringify(analysis))

    // 5. 解析結果をDB更新
    const { error: updateError } = await supabase.from('receipts').update({
      status: 'analyzed' as const,
      vendor_name: analysis.vendor_name,
      amount: analysis.amount,
      tax_amount: analysis.tax_amount,
      transaction_date: analysis.transaction_date,
      description: analysis.description,
      category: analysis.category,
      payment_method: analysis.payment_method,
      raw_ai_response: analysis as unknown as Record<string, unknown>,
    }).eq('id', receipt.id)

    if (updateError) {
      console.error('DB更新エラー:', updateError)
    }

    // 6. LINE返信
    const replyMessage = [
      '領収書を解析しました',
      `取引先: ${analysis.vendor_name || '不明'}`,
      `金額: ${analysis.amount ? formatCurrency(analysis.amount) : '不明'}`,
      `分類: ${analysis.category || '不明'}`,
      `日付: ${analysis.transaction_date || '不明'}`,
      '',
      'Webで確認・修正できます。',
    ].join('\n')

    await replyText(replyToken, replyMessage)
    console.log('処理完了:', receipt.id)
  } catch (error) {
    console.error('画像処理エラー:', error instanceof Error ? error.message : error)
    console.error('スタックトレース:', error instanceof Error ? error.stack : '')

    // 失敗したレシートのステータスを更新
    try {
      const supabase = createAdminClient()
      await supabase
        .from('receipts')
        .update({ status: 'error' as const })
        .eq('line_message_id', messageId)
        .eq('status', 'processing')
    } catch (dbErr) {
      console.error('エラーステータス更新失敗:', dbErr)
    }

    await replyText(replyToken, '領収書の処理中にエラーが発生しました。もう一度お試しください。')
  }
}

export async function handleFollowEvent(event: LineWebhookEvent) {
  if (!event.replyToken) return
  await replyText(event.replyToken, 'AI財務サポーターへようこそ！\n領収書の画像を送信すると、自動で解析・仕訳を行います。\n\nまずWebアプリからアカウント連携を行ってください。')
}

async function replyText(replyToken: string, text: string) {
  try {
    const client = getLineClient()
    await client.replyMessage({ replyToken, messages: [{ type: 'text', text }] })
  } catch (e) {
    console.error('LINE返信エラー:', e instanceof Error ? e.message : e)
  }
}
