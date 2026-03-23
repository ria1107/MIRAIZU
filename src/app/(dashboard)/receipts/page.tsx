'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format'
import { mockReceipts } from '@/mocks/receipts'
import { Search, Filter, Plus } from 'lucide-react'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning', processing: 'info', analyzed: 'success', confirmed: 'success', error: 'error',
}

export default function ReceiptsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = mockReceipts.filter((r) => {
    if (search && !r.vendor_name?.includes(search) && !r.description?.includes(search)) return false
    if (statusFilter && r.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">領収書一覧</h2>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />手動登録</Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="取引先名・摘要で検索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">全てのステータス</option>
              <option value="pending">未処理</option>
              <option value="processing">処理中</option>
              <option value="analyzed">解析済み</option>
              <option value="confirmed">確定</option>
              <option value="error">エラー</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">取引先</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">摘要</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">科目</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">経路</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(r.transaction_date)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <Link href={`/receipts/${r.id}`} className="hover:text-blue-600">{r.vendor_name || '（未解析）'}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{r.description || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.category || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{r.amount ? formatCurrency(r.amount) : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <Badge variant={r.source === 'line' ? 'info' : 'default'}>{r.source === 'line' ? 'LINE' : 'Web'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[r.status] || 'default'}>{getStatusLabel(r.status)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">該当する領収書がありません</div>
          )}
        </div>
      </Card>
    </div>
  )
}
