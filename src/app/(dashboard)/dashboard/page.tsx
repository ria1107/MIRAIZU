'use client'

import { useState, useEffect } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'
import { Receipt } from '@/types/database'
import { TrendingUp, TrendingDown, Receipt as ReceiptIcon, Wallet } from 'lucide-react'
import Link from 'next/link'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning', processing: 'info', analyzed: 'success', confirmed: 'success', error: 'error',
}

export default function DashboardPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('データ取得エラー:', error)
          return
        }
        setReceipts(data || [])
      } catch (e) {
        console.error('データ取得エラー:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchReceipts()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  // 集計
  const analyzedReceipts = receipts.filter(r => r.status === 'analyzed' || r.status === 'confirmed')
  const totalExpense = analyzedReceipts
    .filter(r => r.receipt_type === 'expense')
    .reduce((sum, r) => sum + (r.amount || 0), 0)
  const totalRevenue = analyzedReceipts
    .filter(r => r.receipt_type === 'revenue')
    .reduce((sum, r) => sum + (r.amount || 0), 0)
  const totalAll = analyzedReceipts.reduce((sum, r) => sum + (r.amount || 0), 0)

  // カテゴリ別集計
  const categoryMap: Record<string, number> = {}
  analyzedReceipts.forEach(r => {
    const cat = r.category || '未分類'
    categoryMap[cat] = (categoryMap[cat] || 0) + (r.amount || 0)
  })
  const categoryList = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])

  const summaryCards = [
    { title: '合計金額', value: formatCurrency(totalAll), icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
    { title: '経費合計', value: formatCurrency(totalExpense), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { title: '売上合計', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: '領収書数', value: `${receipts.length}枚`, icon: ReceiptIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {categoryList.length > 0 && (
        <Card>
          <CardTitle>カテゴリ別内訳</CardTitle>
          <div className="mt-4 space-y-3">
            {categoryList.map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{cat}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2"
                      style={{ width: `${totalAll > 0 ? (amount / totalAll) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-24 text-right">{formatCurrency(amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>最近の領収書</CardTitle>
          <Link href="/receipts" className="text-sm text-blue-600 hover:text-blue-500">すべて表示</Link>
        </div>
        {receipts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            まだ領収書がありません。LINEから画像を送信してください。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">取引先</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">科目</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {receipts.slice(0, 10).map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.transaction_date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <Link href={`/receipts/${r.id}`} className="hover:text-blue-600">{r.vendor_name || '（未解析）'}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.category || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{r.amount ? formatCurrency(r.amount) : '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[r.status] || 'default'}>{getStatusLabel(r.status)}</Badge>
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
