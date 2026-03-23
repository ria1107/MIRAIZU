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
  const apiKey = process.env.GEMINI_API_KEY!
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
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
      maxOutputTokens: 1000,
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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    console.error('Gemini応答にテキストなし:', JSON.stringify(data).substring(0, 300))
    throw new Error('No text in Gemini response')
  }

  console.log('Gemini応答:', text.substring(0, 200))
  return parseGeminiJSON(text)
}

function parseGeminiJSON(text: string): ReceiptAnalysisResult {
  // JSONブロックの抽出（```json ... ``` で囲まれている場合に対応）
  let jsonText = text.trim()
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim()
  }

  try {
    return JSON.parse(jsonText)
  } catch {
    // 不正なJSON文字を除去して再試行
    const cleaned = jsonText
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
    return JSON.parse(cleaned)
  }
}
