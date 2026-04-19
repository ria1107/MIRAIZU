import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadToDrive } from '@/lib/google-drive/upload'

// 認証済みユーザーの自分のDriveにファイルをアップロード
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ユーザーのDriveトークンを取得
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('google_drive_refresh_token, google_drive_folder_id')
      .eq('id', user.id)
      .single()

    const p = profile as { google_drive_refresh_token?: string | null; google_drive_folder_id?: string | null } | null
    if (!p?.google_drive_refresh_token || !p?.google_drive_folder_id) {
      return NextResponse.json({ error: 'Google Driveが未連携です' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToDrive(
      buffer,
      file.name,
      file.type,
      p.google_drive_refresh_token,
      p.google_drive_folder_id,
    )

    if (!result) {
      return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Driveアップロードエラー:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
