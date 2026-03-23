export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'MIRAIZU'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const USE_MOCKS = process.env.USE_MOCKS === 'true'

export const ACCOUNT_CATEGORIES = [
  { value: 'supplies', label: '消耗品費', type: 'expense' as const },
  { value: 'transportation', label: '旅費交通費', type: 'expense' as const },
  { value: 'communication', label: '通信費', type: 'expense' as const },
  { value: 'entertainment', label: '接待交際費', type: 'expense' as const },
  { value: 'utilities', label: '水道光熱費', type: 'expense' as const },
  { value: 'rent', label: '地代家賃', type: 'expense' as const },
  { value: 'insurance', label: '保険料', type: 'expense' as const },
  { value: 'taxes', label: '租税公課', type: 'expense' as const },
  { value: 'depreciation', label: '減価償却費', type: 'expense' as const },
  { value: 'advertising', label: '広告宣伝費', type: 'expense' as const },
  { value: 'welfare', label: '福利厚生費', type: 'expense' as const },
  { value: 'repair', label: '修繕費', type: 'expense' as const },
  { value: 'outsourcing', label: '外注費', type: 'expense' as const },
  { value: 'meeting', label: '会議費', type: 'expense' as const },
  { value: 'subscription', label: '支払手数料', type: 'expense' as const },
  { value: 'miscellaneous', label: '雑費', type: 'expense' as const },
  { value: 'revenue', label: '売上高', type: 'revenue' as const },
] as const

export const PAYMENT_METHODS = [
  { value: 'cash', label: '現金' },
  { value: 'credit_card', label: 'クレジットカード' },
  { value: 'bank_transfer', label: '銀行振込' },
  { value: 'e_money', label: '電子マネー' },
  { value: 'qr_payment', label: 'QR決済' },
  { value: 'other', label: 'その他' },
] as const

export const RECEIPT_STATUSES = [
  { value: 'pending', label: '未処理', color: 'yellow' },
  { value: 'processing', label: '処理中', color: 'blue' },
  { value: 'analyzed', label: '解析済み', color: 'green' },
  { value: 'confirmed', label: '確定', color: 'emerald' },
  { value: 'error', label: 'エラー', color: 'red' },
] as const

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'ダッシュボード', icon: 'LayoutDashboard' },
  { href: '/receipts', label: '領収書', icon: 'Receipt' },
  { href: '/expenses', label: '経費', icon: 'TrendingDown' },
  { href: '/sales', label: '売上', icon: 'TrendingUp' },
  { href: '/settings', label: '設定', icon: 'Settings' },
] as const

export const ITEMS_PER_PAGE = 20
