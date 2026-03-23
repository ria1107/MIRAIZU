import { NextRequest, NextResponse } from 'next/server'
import { uploadToDrive } from '@/lib/google-drive/upload'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'ファイルが必要です' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToDrive(buffer, file.name, file.type)

    if (!result) {
      return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Driveアップロードエラー:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
