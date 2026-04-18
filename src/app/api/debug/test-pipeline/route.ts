import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeReceipt } from '@/lib/ai/client'

export const maxDuration = 60

// LINE画像取得 → Gemini解析 の全パイプラインをテスト
export async function GET() {
  const steps: Record<string, unknown> = { timestamp: new Date().toISOString() }

  try {
    // 1. 最新のerrorレシートのline_message_idを取得
    const supabase = createAdminClient()
    const { data: receipts } = await supabase
      .from('receipts')
      .select('id, line_message_id, status')
      .in('status', ['error', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (!receipts?.[0]?.line_message_id) {
      return NextResponse.json({ error: 'No error/processing receipt with line_message_id' })
    }

    const receipt = receipts[0]
    steps.receipt = receipt

    // 2. LINE画像取得テスト
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    steps.lineTokenSet = !!accessToken
    steps.lineTokenLength = accessToken?.length

    const imageUrl = `https://api-data.line.me/v2/bot/message/${receipt.line_message_id}/content`
    steps.imageUrl = imageUrl

    const imgRes = await fetch(imageUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    steps.lineImageStatus = imgRes.status
    steps.lineImageContentType = imgRes.headers.get('content-type')

    if (!imgRes.ok) {
      steps.lineImageError = await imgRes.text()
      return NextResponse.json(steps)
    }

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    steps.imageSize = imgBuffer.length
    const imageBase64 = imgBuffer.toString('base64')
    steps.base64Length = imageBase64.length

    // 3. Gemini解析テスト
    steps.geminiModel = process.env.GEMINI_MODEL || '(default: gemini-2.5-flash)'
    steps.geminiKeySet = !!process.env.GEMINI_API_KEY
    steps.geminiKeyLength = process.env.GEMINI_API_KEY?.length

    const startTime = Date.now()
    try {
      const result = await analyzeReceipt(imageBase64)
      steps.geminiResult = {
        success: true,
        elapsed: `${Date.now() - startTime}ms`,
        data: result,
      }

      // 4. DB更新テスト（実際に更新する）
      const { error: updateError } = await supabase.from('receipts').update({
        status: 'analyzed' as const,
        vendor_name: result.vendor_name,
        amount: result.amount,
        tax_amount: result.tax_amount,
        transaction_date: result.transaction_date,
        description: result.description,
        category: result.category,
        payment_method: result.payment_method,
        raw_ai_response: result as unknown as Record<string, unknown>,
      }).eq('id', receipt.id)

      steps.dbUpdate = updateError ? { error: updateError.message } : { success: true }
    } catch (e) {
      steps.geminiResult = {
        success: false,
        elapsed: `${Date.now() - startTime}ms`,
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack?.split('\n').slice(0, 5) : undefined,
      }
    }
  } catch (e) {
    steps.fatalError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(steps, { status: 200 })
}
