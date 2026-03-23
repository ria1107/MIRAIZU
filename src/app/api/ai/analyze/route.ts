import { NextRequest, NextResponse } from 'next/server'
import { analyzeReceipt } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json()
    if (!imageBase64) {
      return NextResponse.json({ error: '画像データが必要です' }, { status: 400 })
    }

    const result = await analyzeReceipt(imageBase64)
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI解析エラー:', error)
    return NextResponse.json({ error: '解析に失敗しました' }, { status: 500 })
  }
}
