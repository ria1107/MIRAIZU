import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

// リダイレクトURIは専用の環境変数で固定（NEXT_PUBLIC_APP_URLに依存しない）
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://line-invoice.vercel.app/api/auth/google/callback'

/**
 * ユーザーのリフレッシュトークンを使ってDriveクライアントを生成
 */
export function getDriveClientForUser(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  )
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  return google.drive({ version: 'v3', auth: oauth2Client })
}

/**
 * Google OAuth認証URLを生成
 */
export function getGoogleAuthUrl(state?: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  )
  console.log('OAuth redirect_uri:', REDIRECT_URI)
  console.log('OAuth client_id:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...')
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  })
}

/**
 * 認証コードをトークンに交換
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  )
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}
