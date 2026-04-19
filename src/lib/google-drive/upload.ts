import { Readable } from 'stream'
import { getDriveClientForUser } from './client'

interface DriveUploadResult {
  fileId: string
  webViewLink: string
}

/**
 * ユーザーのGoogle Driveに画像をアップロード
 * @param fileBuffer - アップロードするファイルのバッファ
 * @param fileName - ファイル名
 * @param mimeType - MIMEタイプ
 * @param refreshToken - ユーザーのリフレッシュトークン
 * @param folderId - 保存先フォルダID
 */
export async function uploadToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  refreshToken: string,
  folderId: string,
): Promise<DriveUploadResult | null> {
  try {
    const drive = getDriveClientForUser(refreshToken)

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: Readable.from(fileBuffer),
      },
      fields: 'id, webViewLink',
    })

    return {
      fileId: response.data.id!,
      webViewLink: response.data.webViewLink!,
    }
  } catch (error) {
    console.error('Google Driveアップロードエラー:', error)
    return null
  }
}

/**
 * ユーザーのGoogle Driveに「MIRAIZU_領収書」フォルダを作成
 * 既に存在する場合は既存フォルダのIDを返す
 */
export async function createOrGetMiraiFolder(refreshToken: string): Promise<{ folderId: string; folderUrl: string } | null> {
  try {
    const drive = getDriveClientForUser(refreshToken)
    const folderName = 'MIRAIZU_領収書'

    // 既存フォルダを検索
    const existing = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, webViewLink)',
      spaces: 'drive',
    })

    if (existing.data.files && existing.data.files.length > 0) {
      const folder = existing.data.files[0]
      return {
        folderId: folder.id!,
        folderUrl: folder.webViewLink!,
      }
    }

    // フォルダを新規作成
    const newFolder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id, webViewLink',
    })

    return {
      folderId: newFolder.data.id!,
      folderUrl: newFolder.data.webViewLink!,
    }
  } catch (error) {
    console.error('Driveフォルダ作成エラー:', error)
    return null
  }
}
