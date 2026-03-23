'use client'

import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format'
import { mockReceipts, mockMonthlySummary, mockExpenseByCategory } from '@/mocks/receipts'
import { TrendingUp, TrendingDown, Receipt, Wallet } from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280']

const latestMonth = mockMonthlySummary[mockMonthlySummary.length - 1]

const summaryCards = [
  { title: '売上', value: formatCurrency(latestMonth.revenue), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: '経費', value: formatCurrency(latestMonth.expense), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
  { title: '利益', value: formatCurrency(latestMonth.profit), icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
  { title: '領収書数', value: `${mockReceipts.length}枚`, icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-50' },
]

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning', processing: 'info', analyzed: 'success', confirmed: 'success', error: 'error',
}

export default function DashboardPage() {
  const chartData = mockMonthlySummary.map(d => ({
    ...d,
    month: d.month.replace('2024-', '').replace('2025-', '') + '月',
  }))

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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>月次推移</CardTitle>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(v) => formatCurrency(v as number)} />
                <Bar dataKey="revenue" name="売上" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="経費" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>経費内訳</CardTitle>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockExpenseByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {mockExpenseByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>最近の領収書</CardTitle>
          <Link href="/receipts" className="text-sm text-blue-600 hover:text-blue-500">すべて表示</Link>
        </div>
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
              {mockReceipts.slice(0, 5).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.transaction_date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.vendor_name || '-'}</td>
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
      </Card>
    </div>
  )
}
