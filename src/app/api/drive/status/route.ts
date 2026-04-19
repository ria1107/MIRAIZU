import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Google Drive接続状態を取得
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // プロフィールからDrive情報を取得
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('google_drive_refresh_token, google_drive_folder_id, google_drive_folder_url, google_drive_connected_at')
      .eq('id', user.id)
      .single()

    const connected = !!(profile as { google_drive_refresh_token?: string } | null)?.google_drive_refresh_token

    if (!connected) {
      return NextResponse.json({ connected: false })
    }

    const p = profile as {
      google_drive_folder_id: string | null
      google_drive_folder_url: string | null
      google_drive_connected_at: string | null
    }

    // アップロード済みレシート数
    const { count } = await admin
      .from('receipts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('google_drive_file_id', 'is', null)

    return NextResponse.json({
      connected: true,
      folder: {
        id: p.google_drive_folder_id,
        url: p.google_drive_folder_url,
      },
      connectedAt: p.google_drive_connected_at,
      uploadedCount: count || 0,
    })
  } catch (e) {
    console.error('Drive status error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Google Drive連携を解除
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    await admin
      .from('profiles')
      .update({
        google_drive_refresh_token: null,
        google_drive_folder_id: null,
        google_drive_folder_url: null,
        google_drive_connected_at: null,
      } as never)
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Drive disconnect error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
