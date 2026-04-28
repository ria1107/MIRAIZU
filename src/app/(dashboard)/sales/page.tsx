'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatCurrency } from '@/lib/utils/format'
import { Receipt, Customer, SaleItem } from '@/types/database'
import { Plus, X, Check } from 'lucide-react'

type SaleForm = {
  item_id: string
  item_name: string
  customer_id: string
  customer_name: string
  transaction_date: string
  amount: string
  description: string
}

const emptyForm: SaleForm = {
  item_id: '', item_name: '', customer_id: '', customer_name: '',
  transaction_date: new Date().toISOString().slice(0, 10),
  amount: '', description: '',
}

export default function SalesPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<SaleForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fetchReceipts = useCallback(async () => {
    try {
      const res = await fetch('/api/receipts')
      if (res.status === 401) { window.location.href = '/login'; return }
      if (!res.ok) { const d = await res.json(); setError(d.error || 'データ取得に失敗しました'); return }
      const data = await res.json()
      setReceipts(data.receipts || [])
    } catch { setError('サーバーへの接続に失敗しました') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchReceipts()
    fetch('/api/sale-items').then(r => r.ok ? r.json() : []).then(setSaleItems).catch(() => {})
    fetch('/api/customers').then(r => r.ok ? r.json() : []).then(setCustomers).catch(() => {})
  }, [fetchReceipts])

  function handleItemChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    const item = saleItems.find(i => i.id === id)
    setForm(p => ({
      ...p,
      item_id: id,
      item_name: item?.name || '',
      amount: item?.default_price?.toString() || p.amount,
    }))
  }

  function handleCustomerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    const c = customers.find(c => c.id === id)
    setForm(p => ({ ...p, customer_id: id, customer_name: c?.name || '' }))
  }

  async function handleSave() {
    if (!form.amount || !form.transaction_date) { setSaveError('金額と日付は必須です'); return }
    setSaving(true); setSaveError(null)
    try {
      const vendor = form.customer_name || form.item_name || '売上'
      const description = [
        form.item_name && `項目: ${form.item_name}`,
        form.customer_name && `顧客: ${form.customer_name}`,
        form.description,
      ].filter(Boolean).join(' / ')

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt_type: 'sales',
          status: 'confirmed',
          vendor_name: vendor,
          amount: Number(form.amount),
          transaction_date: form.transaction_date,
          description: description || null,
          source: 'web_upload',
        }),
      })
      if (!res.ok) { setSaveError('保存に失敗しました'); return }
      setShowModal(false)
      setForm(emptyForm)
      await fetchReceipts()
    } catch { setSaveError('保存に失敗しました') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <LoadingSpinner />
      <p className="text-sm text-gray-500">データを読み込んでいます...</p>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-center">
        <p className="font-medium">エラーが発生しました</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
        再読み込み
      </button>
    </div>
  )

  const currentMonth = new Date().toISOString().slice(0, 7)
  const analyzed = receipts.filter(r => r.status === 'analyzed' || r.status === 'confirmed')
  const monthlyMap: Record<string, { revenue: number; expense: number }> = {}
  analyzed.forEach(r => {
    const month = r.transaction_date?.slice(0, 7) || '不明'
    if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, expense: 0 }
    if (r.receipt_type === 'sales') monthlyMap[month].revenue += (r.amount || 0)
    if (r.receipt_type === 'expense') monthlyMap[month].expense += (r.amount || 0)
  })
  const monthlySummary = Object.entries(monthlyMap)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, v]) => ({ month, ...v, profit: v.revenue - v.expense }))

  const totalRevenue = analyzed.filter(r => r.receipt_type === 'sales').reduce((s, r) => s + (r.amount || 0), 0)
  const thisMonthRevenue = analyzed.filter(r => r.receipt_type === 'sales' && r.transaction_date?.startsWith(currentMonth)).reduce((s, r) => s + (r.amount || 0), 0)
  const avgMonthlyRevenue = monthlySummary.length > 0 ? Math.round(totalRevenue / monthlySummary.length) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">売上管理</h2>
        <Button onClick={() => { setForm(emptyForm); setSaveError(null); setShowModal(true) }}>
          <Plus className="w-4 h-4 mr-1" />売上を登録
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><p className="text-sm text-gray-500">今月の売上</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(thisMonthRevenue)}</p></Card>
        <Card><p className="text-sm text-gray-500">累計売上</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p></Card>
        <Card><p className="text-sm text-gray-500">月平均売上</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(avgMonthlyRevenue)}</p></Card>
      </div>

      <Card>
        <CardTitle>月別売上推移</CardTitle>
        {monthlySummary.length === 0 ? (
          <div className="mt-4 text-center py-12 text-gray-500">
            まだデータがありません。「売上を登録」またはLINEから登録してください。
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">月</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">売上</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">経費</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">利益</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">利益率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlySummary.map(m => (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.month}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(m.revenue)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(m.expense)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(m.profit)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {m.revenue > 0 ? `${((m.profit / m.revenue) * 100).toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">売上を登録</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">売上項目</label>
                <select value={form.item_id} onChange={handleItemChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500">
                  <option value="">選択してください（任意）</option>
                  {saleItems.map(i => <option key={i.id} value={i.id}>{i.name}{i.default_price ? ` — ${formatCurrency(i.default_price)}` : ''}</option>)}
                </select>
                {saleItems.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">設定ページで売上項目を登録すると選択できます</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">顧客</label>
                <select value={form.customer_id} onChange={handleCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500">
                  <option value="">選択してください（任意）</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">取引日 <span className="text-red-500">*</span></label>
                <input type="date" value={form.transaction_date} onChange={e => setForm(p => ({ ...p, transaction_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額（税込）<span className="text-red-500">*</span></label>
                <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <Button onClick={handleSave} disabled={saving}>
                <Check className="w-4 h-4 mr-1" />{saving ? '登録中...' : '登録する'}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>キャンセル</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
