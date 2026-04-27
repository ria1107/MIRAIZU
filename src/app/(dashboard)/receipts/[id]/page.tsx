'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format'
import { Receipt } from '@/types/database'
import { ArrowLeft, ExternalLink, Save, Check } from 'lucide-react'
import { ACCOUNT_CATEGORIES, PAYMENT_METHODS } from '@/lib/utils/constants'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning', processing: 'info', analyzed: 'success', confirmed: 'success', error: 'error',
}

export default function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    vendor_name: '',
    amount: '',
    tax_amount: '',
    transaction_date: '',
    description: '',
    category: '',
    payment_method: '',
  })

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const res = await fetch(`/api/receipts/${id}`)
        if (res.status === 401) { window.location.href = '/login'; return }
        if (res.status === 404) { setError('領収書が見つかりません'); return }
        if (!res.ok) { setError('データの取得に失敗しました'); return }
        const data: Receipt = await res.json()
        setReceipt(data)
        setFormData({
          vendor_name: data.vendor_name || '',
          amount: data.amount?.toString() || '',
          tax_amount: data.tax_amount?.toString() || '',
          transaction_date: data.transaction_date || '',
          description: data.description || '',
          category: data.category || '',
          payment_method: data.payment_method || '',
        })
      } catch (e) {
        console.error(e)
        setError('サーバーへの接続に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    fetchReceipt()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: formData.amount ? Number(formData.amount) : null,
          tax_amount: formData.tax_amount ? Number(formData.tax_amount) : null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setReceipt(updated)
        setSaveMessage('保存しました')
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage('保存に失敗しました')
      }
    } catch {
      setSaveMessage('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })
      if (res.ok) {
        const updated = await res.json()
        setReceipt(updated)
        setSaveMessage('確定しました')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch {
      setSaveMessage('確定に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <LoadingSpinner />
        <p className="text-sm text-gray-500">データを読み込んでいます...</p>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-center">
          <p className="font-medium">{error || '領収書が見つかりません'}</p>
        </div>
        <button onClick={() => router.back()} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700">
          戻る
        </button>
      </div>
    )
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
            {receipt.original_file_url ? (
              <img src={receipt.original_file_url} alt="領収書画像" className="max-w-full max-h-64 rounded-lg object-contain" />
            ) : (
              <div className="text-gray-400">
                <p className="text-lg font-medium">領収書画像</p>
                <p className="text-sm mt-1">{receipt.file_name || 'ファイルなし'}</p>
              </div>
            )}
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
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />{saving ? '保存中...' : '保存'}
              </Button>
              {receipt.status !== 'confirmed' && (
                <Button variant="outline" onClick={handleConfirm} disabled={saving}>
                  <Check className="w-4 h-4 mr-1" />確定
                </Button>
              )}
              {saveMessage && (
                <span className={`text-sm ${saveMessage.includes('失敗') ? 'text-red-600' : 'text-green-600'}`}>
                  {saveMessage}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 金額サマリー */}
      {receipt.amount && (
        <Card>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">金額（税込）</span>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(receipt.amount)}</p>
            </div>
            {receipt.tax_amount && (
              <div>
                <span className="text-gray-500">消費税額</span>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(receipt.tax_amount)}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">種別</span>
              <p className="text-xl font-bold mt-0.5">{receipt.receipt_type === 'expense' ? '💸 経費' : '💰 売上'}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
