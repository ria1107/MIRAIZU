import { ReceiptAnalysisResult } from '@/types/receipt'
import { RECEIPT_ANALYSIS_PROMPT } from './prompts'
import { mockAnalyzeReceipt } from '@/mocks/openai-response'

const USE_MOCKS = process.env.USE_MOCKS === 'true'
const MAX_RETRIES = 3

export async function analyzeReceipt(imageBase64: string): Promise<ReceiptAnalysisResult> {
  if (USE_MOCKS) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return mockAnalyzeReceipt()
  }

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Gemini解析 試行${attempt}/${MAX_RETRIES}`)
      const result = await callGeminiAPI(imageBase64)
      console.log(`Gemini解析 成功 (試行${attempt})`)
      return result
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      console.error(`Gemini解析 失敗 (試行${attempt}):`, lastError.message)
      if (attempt < MAX_RETRIES) {
        // リトライ前に少し待機
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  throw lastError!
}

async function callGeminiAPI(imageBase64: string): Promise<ReceiptAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY!.trim()
  const model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim()
  console.log('Gemini model:', JSON.stringify(model))
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const requestBody = {
    contents: [
      {
        parts: [
          { text: RECEIPT_ANALYSIS_PROMPT },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 2000,
      // Gemini 2.5のthinkingを無効化（JSON出力と競合するため）
      thinkingConfig: { thinkingBudget: 0 },
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini APIエラー:', response.status, errorText)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts
  if (!parts || parts.length === 0) {
    console.error('Gemini応答にパーツなし:', JSON.stringify(data).substring(0, 500))
    throw new Error('No parts in Gemini response')
  }

  // 全パーツをログ出力（デバッグ用）
  console.log(`Gemini応答パーツ数: ${parts.length}`)
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (p.text) {
      console.log(`パーツ${i}: text(${p.text.length}文字) = ${p.text.substring(0, 100)}`)
    } else {
      console.log(`パーツ${i}: keys=${Object.keys(p).join(',')}`)
    }
  }

  // テキストパーツを後ろから探す（思考パーツが先に来ることがあるため）
  let text: string | undefined
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].text) {
      text = parts[i].text
      break
    }
  }

  if (!text) {
    console.error('Gemini応答にテキストなし:', JSON.stringify(data).substring(0, 500))
    throw new Error('No text in Gemini response')
  }

  console.log('Gemini応答(使用):', text.substring(0, 200))
  return parseGeminiJSON(text)
}

function parseGeminiJSON(text: string): ReceiptAnalysisResult {
  // JSONブロックの抽出（```json ... ``` で囲まれている場合に対応）
  let jsonText = text.trim()

  // Markdownコードブロックを除去
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim()
  }

  // JSONオブジェクトを { ... } で抽出（前後の余分なテキストを除去）
  const objectMatch = jsonText.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    jsonText = objectMatch[0]
  }

  try {
    return JSON.parse(jsonText)
  } catch (e1) {
    console.error('JSONパース1回目失敗:', (e1 as Error).message, 'テキスト先頭100文字:', jsonText.substring(0, 100))

    // 不正なJSON文字を除去して再試行
    let cleaned = jsonText
      .replace(/[\x00-\x1F\x7F]/g, ' ')  // 制御文字をスペースに
      .replace(/,\s*}/g, '}')              // 末尾カンマ除去
      .replace(/,\s*]/g, ']')              // 末尾カンマ除去
      .replace(/'/g, '"')                   // シングルクォートをダブルクォートに
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')  // 引用符なしキーを修正

    try {
      return JSON.parse(cleaned)
    } catch (e2) {
      console.error('JSONパース2回目失敗:', (e2 as Error).message, '全テキスト:', jsonText)
      throw new Error(`Gemini JSON parse error: ${(e1 as Error).message}. Raw text: ${jsonText.substring(0, 300)}`)
    }
  }
}
