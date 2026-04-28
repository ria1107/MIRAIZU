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

    // 6桁のランダムコード生成（暗号的に安全な乱数）
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    const code = (100000 + (array[0] % 900000)).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分有効

    const admin = createAdminClient()

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
