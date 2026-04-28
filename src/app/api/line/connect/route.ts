import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 連携コードを生成してDBに保存
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 6桁の英数字コード生成（数字のみだと売上金額と誤判定されるため英字を含める）
    // 紛らわしい文字(O,0,I,1,L)を除いた32文字から選択
    const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    const array = new Uint8Array(6)
    crypto.getRandomValues(array)
    const code = Array.from(array).map(b => CHARS[b % CHARS.length]).join('')
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分有効

    const admin = createAdminClient()

    // プロフィールが存在しない場合は自動作成（新規ユーザー対応）
    await admin.from('profiles').upsert({
      id: user.id,
      email: user.email || '',
      display_name: (user.user_metadata?.display_name as string) || user.email?.split('@')[0] || '',
      fiscal_year_start: 4,
    }, { onConflict: 'id', ignoreDuplicates: true })

    // 既存の未使用コードを削除
    await admin
      .from('line_connect_codes')
      .delete()
      .eq('user_id', user.id)

    // 新しいコードを保存
    const { error } = await admin
      .from('line_connect_codes')
      .insert({
        user_id: user.id,
        code,
        expires_at: expiresAt.toISOString(),
      })

    if (error) {
      console.error('連携コード保存エラー:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json({ code, expiresAt: expiresAt.toISOString() })
  } catch (e) {
    console.error('連携コード生成エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// 連携状態を取得
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: connection } = await admin
      .from('line_connections')
      .select('line_user_id, display_name, is_active, connected_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    return NextResponse.json({ connected: !!connection, connection })
  } catch (e) {
    console.error('連携状態取得エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// 連携解除
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    await admin
      .from('line_connections')
      .update({ is_active: false })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
