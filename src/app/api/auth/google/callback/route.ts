import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exchangeCodeForTokens } from '@/lib/google-drive/client'
import { createOrGetMiraiFolder } from '@/lib/google-drive/upload'

// Google OAuthコールバック
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // ユーザーがキャンセルした場合
  if (error) {
    console.error('Google OAuth エラー:', error)
    return NextResponse.redirect(`${appUrl}/settings?error=google_cancelled`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?error=google_invalid`)
  }

  try {
    // stateからユーザーIDを復元
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    const userId = stateData.userId
    if (!userId) throw new Error('Invalid state: no userId')

    // コードをトークンに交換
    const tokens = await exchangeCodeForTokens(code)
    if (!tokens.refresh_token) {
      // リフレッシュトークンがない = すでに連携済みでconsentをスキップされた
      // → 既存のrefresh_tokenをそのまま使う
      console.warn('リフレッシュトークンなし。既存の連携を確認...')
      return NextResponse.redirect(`${appUrl}/settings?success=google_already_connected`)
    }

    // MIRAIZU_領収書フォルダを作成または取得
    const folderInfo = await createOrGetMiraiFolder(tokens.refresh_token)
    if (!folderInfo) {
      throw new Error('Driveフォルダの作成に失敗しました')
    }

    // プロフィールにトークンとフォルダ情報を保存
    const supabase = createAdminClient()
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_drive_refresh_token: tokens.refresh_token,
        google_drive_folder_id: folderInfo.folderId,
        google_drive_folder_url: folderInfo.folderUrl,
        google_drive_connected_at: new Date().toISOString(),
      } as never)
      .eq('id', userId)

    if (updateError) {
      console.error('Drive情報保存エラー:', updateError)
      throw new Error('データベースの更新に失敗しました')
    }

    console.log('Google Drive連携完了:', { userId, folderId: folderInfo.folderId })
    return NextResponse.redirect(`${appUrl}/settings?success=google_connected`)
  } catch (e) {
    console.error('Google OAuthコールバックエラー:', e instanceof Error ? e.message : e)
    return NextResponse.redirect(`${appUrl}/settings?error=google_callback_failed`)
  }
}
