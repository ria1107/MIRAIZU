import { format, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '¥0'
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'
  return new Intl.NumberFormat('ja-JP').format(num)
}

export function formatDate(dateStr: string | null | undefined, pattern: string = 'yyyy/MM/dd'): string {
  if (!dateStr) return '-'
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return '-'
    return format(date, pattern, { locale: ja })
  } catch {
    return '-'
  }
}

export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return '-'
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return '今日'
    if (diffDays === 1) return '昨日'
    if (diffDays < 7) return `${diffDays}日前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`
    return `${Math.floor(diffDays / 365)}年前`
  } catch {
    return '-'
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '未処理',
    processing: '処理中',
    analyzed: '解析済み',
    confirmed: '確定',
    error: 'エラー',
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    analyzed: 'bg-green-100 text-green-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    error: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
