'use client'

import { Card, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import { mockMonthlySummary } from '@/mocks/receipts'

export default function SalesPage() {
  const latestMonth = mockMonthlySummary[mockMonthlySummary.length - 1]
  const totalRevenue = mockMonthlySummary.reduce((sum, m) => sum + m.revenue, 0)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">売上管理</h2>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">今月の売上</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(latestMonth.revenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">累計売上（6ヶ月）</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">月平均売上</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(Math.round(totalRevenue / mockMonthlySummary.length))}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>月別売上推移</CardTitle>
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
              {mockMonthlySummary.map((m) => (
                <tr key={m.month} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.month}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(m.revenue)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(m.expense)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(m.profit)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{((m.profit / m.revenue) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
