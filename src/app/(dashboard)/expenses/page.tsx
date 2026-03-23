'use client'

import { Card, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import { mockExpenseByCategory, mockReceipts } from '@/mocks/receipts'

export default function ExpensesPage() {
  const totalExpense = mockExpenseByCategory.reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">経費管理</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">今月の経費合計</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalExpense)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">経費件数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockReceipts.filter(r => r.receipt_type === 'expense').length}件</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">最大カテゴリ</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockExpenseByCategory[0]?.category}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>科目別経費一覧</CardTitle>
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
              {mockExpenseByCategory.map((c) => (
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
      </Card>
    </div>
  )
}
