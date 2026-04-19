import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

/**
 * ユーザーのリフレッシュトークンを使ってDriveクライアントを生成
 */
export function getDriveClientForUser(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
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
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
  )
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // リフレッシュトークンを必ず返す
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
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
  )
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}
