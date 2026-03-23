import { ReceiptAnalysisResult } from '@/types/receipt'

const sampleResults: ReceiptAnalysisResult[] = [
  {
    vendor_name: '東京文具店',
    amount: 3240,
    tax_amount: 294,
    transaction_date: '2025-01-15',
    description: 'ボールペン・ノート購入',
    category: '消耗品費',
    payment_method: '現金',
    confidence: 0.95,
    notes: null,
  },
  {
    vendor_name: 'JR東日本',
    amount: 1520,
    tax_amount: 138,
    transaction_date: '2025-01-16',
    description: '新宿-東京 往復乗車券',
    category: '旅費交通費',
    payment_method: '電子マネー',
    confidence: 0.92,
    notes: null,
  },
  {
    vendor_name: 'ドトールコーヒー 新宿南口店',
    amount: 2750,
    tax_amount: 250,
    transaction_date: '2025-01-17',
    description: 'クライアント打合せ コーヒー・軽食',
    category: '会議費',
    payment_method: 'クレジットカード',
    confidence: 0.88,
    notes: '軽減税率(8%)対象商品を含む可能性があります',
  },
]

let callCount = 0

export function mockAnalyzeReceipt(): ReceiptAnalysisResult {
  const result = sampleResults[callCount % sampleResults.length]
  callCount++
  return result
}
