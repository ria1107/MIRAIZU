import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getGoogleAuthUrl } from '@/lib/google-drive/client'

// Google OAuth認証を開始（設定ページから呼ばれる）
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // stateにユーザーIDを埋め込む（コールバックで照合するため）
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64url')
    const authUrl = getGoogleAuthUrl(state)

    return NextResponse.redirect(authUrl)
  } catch (e) {
    console.error('Google OAuth開始エラー:', e)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_auth_failed`
    )
  }
}
