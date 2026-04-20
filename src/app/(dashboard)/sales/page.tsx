'use client'

import { useState, useEffect } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatCurrency } from '@/lib/utils/format'
import { Receipt } from '@/types/database'

export default function SalesPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const res = await fetch('/api/receipts')
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'データ取得に失敗しました')
          return
        }
        const data = await res.json()
        setReceipts(data.receipts || [])
      } catch (e) {
        console.error('データ取得エラー:', e)
        setError('サーバーへの接続に失敗しました。ページを再読み込みしてください。')
      } finally {
        setLoading(false)
      }
    }
    fetchReceipts()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <LoadingSpinner />
        <p className="text-sm text-gray-500">データを読み込んでいます...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-center">
          <p className="font-medium">エラーが発生しました</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          再読み込み
        </button>
      </div>
    )
  }

  // 集計
  const currentMonth = new Date().toISOString().slice(0, 7) // "YYYY-MM"
  const analyzed = receipts.filter(r => r.status === 'analyzed' || r.status === 'confirmed')

  // 月別グループ化（売上・経費両方）
  const monthlyMap: Record<string, { revenue: number; expense: number }> = {}
  analyzed.forEach(r => {
    const month = r.transaction_date?.slice(0, 7) || '不明'
    if (!monthlyMap[month]) monthlyMap[month] = { revenue: 0, expense: 0 }
    if (r.receipt_type === 'sales') monthlyMap[month].revenue += (r.amount || 0)
    if (r.receipt_type === 'expense') monthlyMap[month].expense += (r.amount || 0)
  })
  const monthlySummary = Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({
      month,
      revenue: v.revenue,
      expense: v.expense,
      profit: v.revenue - v.expense,
    }))

  const totalRevenue = analyzed
    .filter(r => r.receipt_type === 'sales')
    .reduce((sum, r) => sum + (r.amount || 0), 0)
  const thisMonthRevenue = analyzed
    .filter(r => r.receipt_type === 'sales' && r.transaction_date?.startsWith(currentMonth))
    .reduce((sum, r) => sum + (r.amount || 0), 0)
  const avgMonthlyRevenue = monthlySummary.length > 0
    ? Math.round(totalRevenue / monthlySummary.length)
    : 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">売上管理</h2>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">今月の売上</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(thisMonthRevenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">累計売上</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">月平均売上</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(avgMonthlyRevenue)}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>月別売上推移</CardTitle>
        {monthlySummary.length === 0 ? (
          <div className="mt-4 text-center py-12 text-gray-500">
            まだデータがありません。LINEから領収書を送信してください。
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
                {monthlySummary.map((m) => (
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
    </div>
  )
}
