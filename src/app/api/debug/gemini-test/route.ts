import { NextResponse } from 'next/server'

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

  // Test 1: テキスト生成テスト (REST API直接呼び出し)
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say "Hello" in Japanese. Reply with just the word.' }] }],
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      results.textTest = { success: false, status: res.status, error: data }
    } else {
      results.textTest = {
        success: true,
        response: data.candidates?.[0]?.content?.parts?.[0]?.text,
      }
    }
  } catch (e) {
    results.textTest = { success: false, error: e instanceof Error ? e.message : String(e) }
  }

  // Test 2: 画像解析テスト - 1x1ピクセルの有効なPNG画像
  try {
    // 最小限の有効なPNG (1x1 赤ピクセル)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'What color is this pixel? Reply with JSON: {"color": "..."}' },
            { inline_data: { mime_type: 'image/png', data: pngBase64 } },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 100 },
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      results.imageTest = { success: false, status: res.status, error: data }
    } else {
      results.imageTest = {
        success: true,
        response: data.candidates?.[0]?.content?.parts?.[0]?.text,
      }
    }
  } catch (e) {
    results.imageTest = { success: false, error: e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json(results, { status: 200 })
}
