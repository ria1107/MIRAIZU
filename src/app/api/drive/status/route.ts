import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getDriveClient } from '@/lib/google-drive/client'

// Google Drive接続状態を取得
export async function GET() {
  try {
    // 認証チェック
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 環境変数チェック
    const configured = !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_DRIVE_FOLDER_ID
    )

    if (!configured) {
      return NextResponse.json({
        connected: false,
        reason: 'not_configured',
        message: 'Google Drive環境変数が未設定です',
      })
    }

    // 接続テスト - フォルダにアクセスできるか確認
    try {
      const drive = getDriveClient()
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!
      const folder = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, webViewLink',
      })

      // このユーザーのレシート中、Driveにアップロード済みの数を取得
      const { count } = await supabase
        .from('receipts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('google_drive_file_id', 'is', null)

      return NextResponse.json({
        connected: true,
        folder: {
          id: folder.data.id,
          name: folder.data.name,
          url: folder.data.webViewLink,
        },
        uploadedCount: count || 0,
      })
    } catch (driveErr) {
      console.error('Drive接続テストエラー:', driveErr)
      return NextResponse.json({
        connected: false,
        reason: 'connection_error',
        message: 'Google Driveに接続できません。サービスアカウントの設定を確認してください。',
      })
    }
  } catch (e) {
    console.error('Drive status error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// 接続テスト（テストファイルをアップロードして削除）
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configured = !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_DRIVE_FOLDER_ID
    )

    if (!configured) {
      return NextResponse.json({ success: false, message: '環境変数が未設定です' })
    }

    const drive = getDriveClient()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!

    // テストファイル作成
    const { Readable } = await import('stream')
    const testContent = `MIRAIZU接続テスト - ${new Date().toISOString()}`
    const testFile = await drive.files.create({
      requestBody: {
        name: `_miraizu_test_${Date.now()}.txt`,
        parents: [folderId],
      },
      media: {
        mimeType: 'text/plain',
        body: Readable.from(Buffer.from(testContent)),
      },
      fields: 'id, name, webViewLink',
    })

    // テストファイルを削除
    if (testFile.data.id) {
      await drive.files.delete({ fileId: testFile.data.id })
    }

    return NextResponse.json({
      success: true,
      message: 'Google Driveへの接続テストが成功しました',
    })
  } catch (e) {
    console.error('Drive test error:', e)
    return NextResponse.json({
      success: false,
      message: e instanceof Error ? e.message : 'テスト失敗',
    })
  }
}
