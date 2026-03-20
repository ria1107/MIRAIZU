import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 60

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      GEMINI_API_KEY_set: !!process.env.GEMINI_API_KEY,
      GEMINI_API_KEY_length: process.env.GEMINI_API_KEY?.length || 0,
      GEMINI_MODEL: process.env.GEMINI_MODEL || '(not set, default: gemini-2.5-flash)',
      USE_MOCKS: process.env.USE_MOCKS,
      LINE_CHANNEL_ACCESS_TOKEN_set: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    },
  }

  // Test 1: テキスト生成テスト
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    })
    const textResult = await model.generateContent('Say "Hello" in Japanese. Reply with just the word.')
    results.textTest = {
      success: true,
      response: textResult.response.text(),
    }
  } catch (e) {
    results.textTest = {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    }
  }

  // Test 2: 小さなテスト画像（1x1 白ピクセルのJPEG）で画像解析テスト
  try {
    // 最小限のJPEG画像（1x1ピクセル）
    const tinyJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRJGipKaxJgQsJdLwFWRhY2JygpKTo2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwA='

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 200,
      },
    })
    const imageResult = await model.generateContent([
      'This is a test image. Reply with JSON: {"test": "ok"}',
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: tinyJpegBase64,
        },
      },
    ])
    results.imageTest = {
      success: true,
      response: imageResult.response.text(),
    }
  } catch (e) {
    results.imageTest = {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split('\n').slice(0, 5) : undefined,
    }
  }

  // Test 3: @google/generative-ai パッケージバージョン確認
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('@google/generative-ai/package.json')
    results.sdkVersion = pkg.version
  } catch {
    results.sdkVersion = 'could not determine'
  }

  return NextResponse.json(results, { status: 200 })
}
