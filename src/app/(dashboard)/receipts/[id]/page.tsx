'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format'
import { mockReceipts } from '@/mocks/receipts'
import { ArrowLeft, ExternalLink, Save } from 'lucide-react'
import { ACCOUNT_CATEGORIES, PAYMENT_METHODS } from '@/lib/utils/constants'
import { useState } from 'react'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning', processing: 'info', analyzed: 'success', confirmed: 'success', error: 'error',
}

export default function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const receipt = mockReceipts.find(r => r.id === id) || mockReceipts[0]

  const [formData, setFormData] = useState({
    vendor_name: receipt.vendor_name || '',
    amount: receipt.amount?.toString() || '',
    tax_amount: receipt.tax_amount?.toString() || '',
    transaction_date: receipt.transaction_date || '',
    description: receipt.description || '',
    category: receipt.category || '',
    payment_method: receipt.payment_method || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">領収書詳細</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant[receipt.status] || 'default'}>{getStatusLabel(receipt.status)}</Badge>
            <span className="text-sm text-gray-500">登録日: {formatDate(receipt.created_at, 'yyyy/MM/dd HH:mm')}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>画像プレビュー</CardTitle>
          <div className="mt-4 bg-gray-100 rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
            <div className="text-gray-400">
              <p className="text-lg font-medium">領収書画像</p>
              <p className="text-sm mt-1">{receipt.file_name || 'ファイルなし'}</p>
            </div>
          </div>
          {receipt.google_drive_url && (
            <a href={receipt.google_drive_url} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500">
              <ExternalLink className="w-4 h-4" />Google Driveで開く
            </a>
          )}
        </Card>

        <Card>
          <CardTitle>AI解析結果</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">取引先名</label>
              <input name="vendor_name" value={formData.vendor_name} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額（税込）</label>
                <input name="amount" type="number" value={formData.amount} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">消費税額</label>
                <input name="tax_amount" type="number" value={formData.tax_amount} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">取引日</label>
              <input name="transaction_date" type="date" value={formData.transaction_date} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">勘定科目</label>
              <select name="category" value={formData.category} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">選択してください</option>
                {ACCOUNT_CATEGORIES.map(c => <option key={c.value} value={c.label}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支払方法</label>
              <select name="payment_method" value={formData.payment_method} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">選択してください</option>
                {PAYMENT_METHODS.map(p => <option key={p.value} value={p.label}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button><Save className="w-4 h-4 mr-1" />保存</Button>
              <Button variant="outline">確定</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
