import { Receipt, ReceiptStatus } from './database'

export interface ReceiptAnalysisResult {
  vendor_name: string | null
  amount: number | null
  tax_amount: number | null
  transaction_date: string | null
  description: string | null
  category: string | null
  payment_method: string | null
  confidence: number
  notes: string | null
}

export interface ReceiptFilter {
  status?: ReceiptStatus
  category?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}

export interface ReceiptListResponse {
  receipts: Receipt[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ReceiptFormData {
  vendor_name: string
  amount: number
  tax_amount?: number
  transaction_date: string
  description?: string
  category: string
  payment_method?: string
  receipt_type: 'expense' | 'sales'
}
