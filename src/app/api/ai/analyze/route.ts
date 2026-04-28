import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { analyzeReceipt } from '@/lib/ai/client'

const MAX_BASE64_SIZE = 10 * 1024 * 1024 // 10MB (base64 encoded)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { imageBase64 } = await request.json()
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: '画像データが必要です' }, { status: 400 })
    }
    if (imageBase64.length > MAX_BASE64_SIZE) {
      return NextResponse.json({ error: '画像サイズが大きすぎます' }, { status: 400 })
    }

    const result = await analyzeReceipt(imageBase64)
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI解析エラー:', error)
    return NextResponse.json({ error: '解析に失敗しました' }, { status: 500 })
  }
}
