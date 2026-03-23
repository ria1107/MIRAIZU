import OpenAI from 'openai'
import { ReceiptAnalysisResult } from '@/types/receipt'
import { RECEIPT_ANALYSIS_PROMPT } from './prompts'
import { mockAnalyzeReceipt } from '@/mocks/openai-response'

const USE_MOCKS = process.env.USE_MOCKS === 'true'

export async function analyzeReceipt(imageBase64: string): Promise<ReceiptAnalysisResult> {
  if (USE_MOCKS) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return mockAnalyzeReceipt()
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: RECEIPT_ANALYSIS_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}
