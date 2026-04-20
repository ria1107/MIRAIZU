'use client'

import { useState, useEffect } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatCurrency } from '@/lib/utils/format'
import { Receipt } from '@/types/database'

export default function ExpensesPage() {
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
  const expenses = analyzed.filter(r => r.receipt_type === 'expense')
  const totalExpense = expenses.reduce((sum, r) => sum + (r.amount || 0), 0)
  const thisMonthExpense = expenses
    .filter(r => r.transaction_date?.startsWith(currentMonth))
    .reduce((sum, r) => sum + (r.amount || 0), 0)

  // カテゴリ別集計
  const categoryMap: Record<string, number> = {}
  expenses.forEach(r => {
    const cat = r.category || '未分類'
    categoryMap[cat] = (categoryMap[cat] || 0) + (r.amount || 0)
  })
  const categoryList = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">経費管理</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">今月の経費合計</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(thisMonthExpense)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">経費件数（分析済み）</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{expenses.length}件</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">最大カテゴリ</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{categoryList[0]?.category || '-'}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>科目別経費一覧</CardTitle>
        {categoryList.length === 0 ? (
          <div className="mt-4 text-center py-12 text-gray-500">
            まだデータがありません。LINEから領収書を送信してください。
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">勘定科目</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">構成比</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">バー</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categoryList.map((c) => (
                  <tr key={c.category}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.category}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(c.amount)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{c.percentage}%</td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 rounded-full h-2" style={{ width: `${c.percentage}%` }} />
                      </div>
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
