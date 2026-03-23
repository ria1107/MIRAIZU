import { NextResponse } from 'next/server'
import { analyzeReceipt } from '@/lib/ai/client'

export const maxDuration = 60

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  }

  // Step 1: 最新の処理中レシートを取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!

  try {
    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/receipts?select=id,status,line_message_id,created_at&status=eq.processing&order=created_at.desc&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const receipts = await dbRes.json()
    results.latestReceipt = receipts[0] || null

    if (!receipts[0]?.line_message_id) {
      results.error = 'No processing receipt found'
      return NextResponse.json(results)
    }

    const messageId = receipts[0].line_message_id

    // Step 2: LINE画像をダウンロード
    const lineUrl = `https://api-data.line.me/v2/bot/message/${messageId}/content`
    results.lineImageUrl = lineUrl

    const imgRes = await fetch(lineUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    results.lineImageStatus = imgRes.status
    results.lineImageHeaders = Object.fromEntries(imgRes.headers.entries())

    if (!imgRes.ok) {
      const errText = await imgRes.text()
      results.lineImageError = errText
      return NextResponse.json(results)
    }

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    results.imageSize = imgBuffer.length
    results.imageBase64Length = imgBuffer.toString('base64').length

    // Step 3: Gemini解析
    const startTime = Date.now()
    try {
      const analysis = await analyzeReceipt(imgBuffer.toString('base64'))
      results.analysis = {
        success: true,
        elapsed: `${Date.now() - startTime}ms`,
        result: analysis,
      }
    } catch (e) {
      results.analysis = {
        success: false,
        elapsed: `${Date.now() - startTime}ms`,
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack?.split('\n').slice(0, 8) : undefined,
      }
    }
  } catch (e) {
    results.error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results, { status: 200 })
}
