import { NextResponse } from 'next/server'
import { analyzeReceipt } from '@/lib/ai/client'

export const maxDuration = 60

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY!
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      GEMINI_API_KEY_set: !!apiKey,
      GEMINI_API_KEY_length: apiKey?.length || 0,
      GEMINI_MODEL: model,
      USE_MOCKS: process.env.USE_MOCKS,
      LINE_CHANNEL_ACCESS_TOKEN_set: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    },
  }

  // Test 1: 実際のanalyzeReceipt関数で画像解析テスト
  // (Wikipediaのサンプルレシート画像を使用)
  try {
    // テスト用のサンプル画像をダウンロード
    const sampleImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/ReceiptSwiss.jpg/220px-ReceiptSwiss.jpg'
    const imgRes = await fetch(sampleImageUrl)
    if (!imgRes.ok) {
      results.imageDownload = { success: false, status: imgRes.status }
    } else {
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
      const imgBase64 = imgBuffer.toString('base64')
      results.imageDownload = {
        success: true,
        size: imgBuffer.length,
        base64Length: imgBase64.length,
        base64Preview: imgBase64.substring(0, 50) + '...',
      }

      // analyzeReceipt関数を実際に呼び出し
      const startTime = Date.now()
      const analysis = await analyzeReceipt(imgBase64)
      const elapsed = Date.now() - startTime
      results.analyzeReceipt = {
        success: true,
        elapsed: `${elapsed}ms`,
        result: analysis,
      }
    }
  } catch (e) {
    results.analyzeReceipt = {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split('\n').slice(0, 5) : undefined,
    }
  }

  // Test 2: LINE画像取得テスト（最新のメッセージIDがあれば）
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && supabaseKey) {
      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/receipts?select=id,status,line_message_id,created_at&order=created_at.desc&limit=5`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      )
      const receipts = await dbRes.json()
      results.recentReceipts = receipts
    }
  } catch (e) {
    results.recentReceipts = { error: e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json(results, { status: 200 })
}
