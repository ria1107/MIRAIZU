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

    // Step 3: Gemini解析（生テキストも確認）
    const startTime = Date.now()
    const apiKey = process.env.GEMINI_API_KEY!
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    const { RECEIPT_ANALYSIS_PROMPT } = await import('@/lib/ai/prompts')
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: RECEIPT_ANALYSIS_PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: imgBuffer.toString('base64') } },
        ]}],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1000 },
      }),
    })
    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    results.geminiRawResponse = {
      status: geminiRes.status,
      rawText: rawText,
      finishReason: geminiData.candidates?.[0]?.finishReason,
      elapsed: `${Date.now() - startTime}ms`,
    }

    // パース試行
    try {
      const analysis = await analyzeReceipt(imgBuffer.toString('base64'))
      results.analysis = {
        success: true,
        result: analysis,
      }
    } catch (e) {
      results.analysis = {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      }
    }
  } catch (e) {
    results.error = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results, { status: 200 })
}
