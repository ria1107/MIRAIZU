import { Readable } from 'stream'
import { getDriveClient } from './client'
import { mockUploadToDrive } from '@/mocks/google-drive'

const USE_MOCKS = process.env.USE_MOCKS === 'true'

interface DriveUploadResult {
  fileId: string
  webViewLink: string
}

export async function uploadToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<DriveUploadResult | null> {
  if (USE_MOCKS) {
    const mock = mockUploadToDrive(fileName)
    return { fileId: mock.fileId, webViewLink: mock.webViewLink }
  }

  try {
    const drive = getDriveClient()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: folderId ? [folderId] : undefined,
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
