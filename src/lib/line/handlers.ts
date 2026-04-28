import { getLineClient } from './client'
import { analyzeReceipt } from '@/lib/ai/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadToDrive } from '@/lib/google-drive/upload'
import { LineWebhookEvent } from '@/types/line'
import { formatCurrency } from '@/lib/utils/format'

export async function handleMessageEvent(event: LineWebhookEvent) {
  if (!event.message || !event.replyToken) return
  const { message, source, replyToken } = event
  const lineUserId = source.userId!

  if (message.type === 'image') {
    await handleImageMessage(message.id, lineUserId, replyToken)
  } else if (message.type === 'text') {
    const text = message.text?.trim() || ''
    // 6桁英数字（英字を含む）→ 連携コード処理（純粋な数字のみは金額と区別するため除外）
    if (/^[A-Z0-9]{6}$/.test(text) && /[A-Z]/.test(text)) {
      await handleConnectCode(text, lineUserId, replyToken)
    } else if (text === '売上' || text === '売上登録') {
      await handleSalesFlow(lineUserId, replyToken, 'start', text)
    } else {
      // アクティブなセッションがあれば会話を続ける
      const supabase = createAdminClient()
      const { data: session } = await supabase
        .from('line_sessions')
        .select('*')
        .eq('line_user_id', lineUserId)
        .eq('session_type', 'sales')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (session) {
        await handleSalesFlow(lineUserId, replyToken, session.step, text, session.data as Record<string, unknown>)
      } else {
        await replyText(replyToken, 'MIRAIZUです。\n\n・領収書の画像を送信 → 自動解析\n・「売上」と送信 → 売上登録\n・6桁の連携コードを送信 → アカウント連携')
      }
    }
  }
}

async function handleSalesFlow(
  lineUserId: string,
  replyToken: string,
  step: string,
  input: string,
  sessionData: Record<string, unknown> = {}
) {
  const supabase = createAdminClient()

  // LINE連携確認
  const { data: connection } = await supabase
    .from('line_connections')
    .select('user_id')
    .eq('line_user_id', lineUserId)
    .single()

  if (!connection) {
    await replyText(replyToken, 'アカウントが連携されていません。Webアプリからアカウント連携を行ってください。')
    return
  }
  const userId = connection.user_id

  async function upsertSession(newStep: string, data: Record<string, unknown>) {
    await supabase.from('line_sessions').upsert({
      line_user_id: lineUserId,
      user_id: userId,
      session_type: 'sales',
      step: newStep,
      data,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }, { onConflict: 'line_user_id' })
  }

  async function deleteSession() {
    await supabase.from('line_sessions').delete().eq('line_user_id', lineUserId)
  }

  if (step === 'start') {
    // 売上項目一覧取得
    const { data: items } = await supabase
      .from('sale_items')
      .select('id, name, default_price')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order')
      .limit(13)

    if (!items || items.length === 0) {
      await upsertSession('enter_amount', {})
      await replyText(replyToken, '売上を登録します。\n\n金額を入力してください（数字のみ）\n例: 50000')
      return
    }

    await upsertSession('select_item', { items })
    const client = getLineClient()
    await client.replyMessage({
      replyToken,
      messages: [{
        type: 'text',
        text: '売上項目を選択してください',
        quickReply: {
          items: [
            ...items.map(i => ({
              type: 'action' as const,
              action: { type: 'message' as const, label: i.name.slice(0, 20), text: i.name },
            })),
            { type: 'action' as const, action: { type: 'message' as const, label: 'その他', text: 'その他' } },
          ],
        },
      }],
    })
    return
  }

  if (step === 'select_item') {
    if (input === 'キャンセル') { await deleteSession(); await replyText(replyToken, 'キャンセルしました。'); return }
    const items = (sessionData.items as Array<{ id: string; name: string; default_price: number | null }>) || []
    const selected = items.find(i => i.name === input)
    const itemName = selected?.name || (input !== 'その他' ? input : '')
    const defaultPrice = selected?.default_price

    // 顧客一覧取得
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name')
      .eq('user_id', userId)
      .order('name')
      .limit(13)

    const newData = { ...sessionData, item_name: itemName, item_id: selected?.id || null, default_price: defaultPrice }

    if (!customers || customers.length === 0) {
      await upsertSession('enter_amount', newData)
      const msg = defaultPrice
        ? `金額を入力してください（デフォルト: ¥${defaultPrice.toLocaleString()}）\n変更がなければそのまま入力してください`
        : '金額を入力してください（数字のみ）\n例: 50000'
      await replyText(replyToken, msg)
      return
    }

    await upsertSession('select_customer', newData)
    const client = getLineClient()
    await client.replyMessage({
      replyToken,
      messages: [{
        type: 'text',
        text: '顧客を選択してください',
        quickReply: {
          items: [
            ...customers.map(c => ({
              type: 'action' as const,
              action: { type: 'message' as const, label: c.name.slice(0, 20), text: c.name },
            })),
            { type: 'action' as const, action: { type: 'message' as const, label: 'その他・なし', text: 'その他' } },
          ],
        },
      }],
    })
    return
  }

  if (step === 'select_customer') {
    if (input === 'キャンセル') { await deleteSession(); await replyText(replyToken, 'キャンセルしました。'); return }
    const customerName = input !== 'その他' ? input : ''
    const { data: customers } = await supabase.from('customers').select('id, name').eq('user_id', userId)
    const customer = customers?.find(c => c.name === customerName)
    const newData = { ...sessionData, customer_name: customerName, customer_id: customer?.id || null }

    await upsertSession('enter_amount', newData)
    const defaultPrice = sessionData.default_price as number | null
    const msg = defaultPrice
      ? `金額を入力してください（デフォルト: ¥${defaultPrice.toLocaleString()}）`
      : '金額を入力してください（数字のみ）\n例: 50000'
    await replyText(replyToken, msg)
    return
  }

  if (step === 'enter_amount') {
    if (input === 'キャンセル') { await deleteSession(); await replyText(replyToken, 'キャンセルしました。'); return }
    const amount = Number(input.replace(/[,，￥¥]/g, '').trim())
    if (isNaN(amount) || amount <= 0) {
      await replyText(replyToken, '金額を数字で入力してください\n例: 50000')
      return
    }

    const itemName = sessionData.item_name as string || ''
    const customerName = sessionData.customer_name as string || ''
    const confirmText = [
      '以下の内容で登録します',
      itemName && `項目: ${itemName}`,
      customerName && `顧客: ${customerName}`,
      `金額: ¥${amount.toLocaleString()}`,
      `日付: ${new Date().toLocaleDateString('ja-JP')}`,
    ].filter(Boolean).join('\n')

    await upsertSession('confirm', { ...sessionData, amount })
    const client = getLineClient()
    await client.replyMessage({
      replyToken,
      messages: [{
        type: 'text',
        text: confirmText,
        quickReply: {
          items: [
            { type: 'action' as const, action: { type: 'message' as const, label: '✅ 確定', text: '確定' } },
            { type: 'action' as const, action: { type: 'message' as const, label: '❌ キャンセル', text: 'キャンセル' } },
          ],
        },
      }],
    })
    return
  }

  if (step === 'confirm') {
    if (input === 'キャンセル') { await deleteSession(); await replyText(replyToken, 'キャンセルしました。'); return }
    if (input !== '確定') { await replyText(replyToken, '「確定」または「キャンセル」で返信してください'); return }

    const amount = sessionData.amount as number
    const itemName = sessionData.item_name as string || ''
    const customerName = sessionData.customer_name as string || ''
    const vendorName = customerName || itemName || '売上'
    const description = [itemName && `項目: ${itemName}`, customerName && `顧客: ${customerName}`].filter(Boolean).join(' / ')
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('receipts').insert({
      user_id: userId,
      receipt_type: 'sales',
      status: 'confirmed',
      vendor_name: vendorName,
      amount,
      transaction_date: today,
      description: description || null,
      source: 'line',
    })

    await deleteSession()
    if (error) {
      await replyText(replyToken, '登録に失敗しました。もう一度お試しください。')
    } else {
      await replyText(replyToken, `✅ 売上を登録しました\n\n金額: ¥${amount.toLocaleString()}\n日付: ${today}${itemName ? `\n項目: ${itemName}` : ''}${customerName ? `\n顧客: ${customerName}` : ''}`)
    }
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

    // 5. Google Driveにアップロード（ユーザーが連携している場合）
    let driveUrl: string | null = null
    let driveFileId: string | null = null
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('google_drive_refresh_token, google_drive_folder_id')
        .eq('id', connection.user_id)
        .single()

      const profile = userProfile as { google_drive_refresh_token?: string | null; google_drive_folder_id?: string | null } | null
      if (profile?.google_drive_refresh_token && profile?.google_drive_folder_id) {
        console.log('Google Driveアップロード中...')
        const dateStr = analysis.transaction_date || new Date().toISOString().split('T')[0]
        const vendorStr = (analysis.vendor_name || 'unknown').replace(/[/\\?%*:|"<>]/g, '_')
        const driveFileName = `${dateStr}_${vendorStr}_${receipt.id.substring(0, 8)}.jpg`
        const driveResult = await uploadToDrive(
          imageBuffer,
          driveFileName,
          'image/jpeg',
          profile.google_drive_refresh_token,
          profile.google_drive_folder_id,
        )
        if (driveResult) {
          driveFileId = driveResult.fileId
          driveUrl = driveResult.webViewLink
          console.log('Google Driveアップロード成功:', driveFileId)
        }
      } else {
        console.log('Google Drive未連携のためスキップ')
      }
    } catch (driveErr) {
      console.error('Google Driveアップロードエラー（処理は継続）:', driveErr)
    }

    // 6. 解析結果をDB更新
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
      ...(driveFileId && { google_drive_file_id: driveFileId }),
      ...(driveUrl && { google_drive_url: driveUrl }),
    }).eq('id', receipt.id)

    if (updateError) {
      console.error('DB更新エラー:', updateError)
    }

    // 7. LINE返信
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

async function handleConnectCode(code: string, lineUserId: string, replyToken: string) {
  try {
    const supabase = createAdminClient()

    // コードを検索
    const { data: codeRecord } = await supabase
      .from('line_connect_codes')
      .select('user_id, expires_at, used')
      .eq('code', code)
      .eq('used', false)
      .single()

    if (!codeRecord) {
      await replyText(replyToken, '連携コードが見つかりません。Webアプリで新しいコードを発行してください。')
      return
    }

    // 有効期限チェック
    if (new Date(codeRecord.expires_at) < new Date()) {
      await replyText(replyToken, '連携コードの有効期限が切れています。Webアプリで新しいコードを発行してください。')
      return
    }

    // 既存の連携を削除
    await supabase
      .from('line_connections')
      .delete()
      .eq('user_id', codeRecord.user_id)

    // LINE連携を新規登録
    const { error: connError } = await supabase
      .from('line_connections')
      .insert({
        user_id: codeRecord.user_id,
        line_user_id: lineUserId,
        display_name: 'LINEユーザー',
        is_active: true,
      })

    if (connError) {
      console.error('LINE連携登録エラー:', connError)
      await replyText(replyToken, '連携処理中にエラーが発生しました。')
      return
    }

    // コードを使用済みに
    await supabase
      .from('line_connect_codes')
      .update({ used: true })
      .eq('code', code)

    await replyText(replyToken, 'アカウント連携が完了しました！🎉\n\n領収書の画像を送信すると、自動で解析・登録されます。')
  } catch (error) {
    console.error('連携コード処理エラー:', error)
    await replyText(replyToken, '連携処理中にエラーが発生しました。もう一度お試しください。')
  }
}

export async function handleFollowEvent(event: LineWebhookEvent) {
  if (!event.replyToken) return
  await replyText(event.replyToken, 'MIRAIZUへようこそ！\n領収書の画像を送信すると、自動で解析・仕訳を行います。\n\nまずWebアプリからアカウント連携を行ってください。')
}

async function replyText(replyToken: string, text: string) {
  try {
    const client = getLineClient()
    await client.replyMessage({ replyToken, messages: [{ type: 'text', text }] })
  } catch (e) {
    console.error('LINE返信エラー:', e instanceof Error ? e.message : e)
  }
}
