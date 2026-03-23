export interface MockDriveUploadResult {
  fileId: string
  webViewLink: string
  name: string
}

let uploadCount = 0

export function mockUploadToDrive(fileName: string): MockDriveUploadResult {
  uploadCount++
  return {
    fileId: `mock-drive-file-${uploadCount}`,
    webViewLink: `https://drive.google.com/file/d/mock-drive-file-${uploadCount}/view`,
    name: fileName,
  }
}
