import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const results: Record<string, unknown> = {}

  // 1. 管理者ユーザーを作成（既に存在する場合はスキップ）
  const email = 'shogo.n.work@gmail.com'
  const password = 'admin1234'

  // まず既存ユーザーを確認
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(u => u.email === email)

  let userId: string
  if (existingUser) {
    userId = existingUser.id
    results.user = { status: 'already_exists', id: userId, email }
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) {
      results.user = { status: 'error', error: createError.message }
      return NextResponse.json(results)
    }
    userId = newUser.user.id
    results.user = { status: 'created', id: userId, email }
  }

  // 2. プロフィールを作成/更新
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      display_name: '管理者',
      email,
    })
  results.profile = profileError ? { error: profileError.message } : { status: 'ok' }

  // 3. LINE連携を確認 - 既存のレシートからLINEユーザーIDを取得
  const { data: receipts } = await supabase
    .from('receipts')
    .select('user_id, line_message_id')
    .not('line_message_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  results.existingReceipts = receipts

  // 4. 既存のLINE連携を確認
  const { data: connections } = await supabase
    .from('line_connections')
    .select('*')

  results.lineConnections = connections

  // 5. 既存レシートのuser_idを確認して、そのLINEユーザーIDを取得
  if (receipts && receipts.length > 0) {
    const receiptUserId = receipts[0].user_id
    results.receiptUserId = receiptUserId

    // LINE連携テーブルからLINEユーザーIDを取得
    const { data: conn } = await supabase
      .from('line_connections')
      .select('line_user_id')
      .eq('user_id', receiptUserId)
      .single()

    if (conn) {
      results.lineUserId = conn.line_user_id

      // 既存の連携が管理者アカウントでない場合、更新
      if (receiptUserId !== userId) {
        // 古い連携を削除
        await supabase.from('line_connections').delete().eq('user_id', receiptUserId)
        // 新しい連携を作成
        const { error: connError } = await supabase.from('line_connections').upsert({
          user_id: userId,
          line_user_id: conn.line_user_id,
        })
        results.connectionUpdate = connError ? { error: connError.message } : { status: 'updated_to_admin' }

        // 既存レシートのuser_idも更新
        const { error: updateError, count } = await supabase
          .from('receipts')
          .update({ user_id: userId })
          .eq('user_id', receiptUserId)
        results.receiptsUpdate = updateError ? { error: updateError.message } : { status: 'updated', count }
      } else {
        results.connectionUpdate = { status: 'already_correct' }
      }
    }
  }

  // 6. 全レシートの状況を表示
  const { data: allReceipts } = await supabase
    .from('receipts')
    .select('id, user_id, status, vendor_name, amount, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  results.allReceipts = allReceipts

  return NextResponse.json(results, { status: 200 })
}
