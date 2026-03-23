import { ReceiptAnalysisResult } from '@/types/receipt'
import { RECEIPT_ANALYSIS_PROMPT } from './prompts'
import { mockAnalyzeReceipt } from '@/mocks/openai-response'

const USE_MOCKS = process.env.USE_MOCKS === 'true'

export async function analyzeReceipt(imageBase64: string): Promise<ReceiptAnalysisResult> {
  if (USE_MOCKS) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return mockAnalyzeReceipt()
  }

  const apiKey = process.env.GEMINI_API_KEY!
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  // Gemini REST API を直接呼び出し（SDK のBase64処理問題を回避）
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

  console.log('Gemini API呼び出し:', { model, imageSize: imageBase64.length })

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Gemini APIエラー:', response.status, errorText)
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('Gemini API応答取得')

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    console.error('Gemini応答にテキストなし:', JSON.stringify(data))
    throw new Error('No text in Gemini response')
  }

  return JSON.parse(text)
}
