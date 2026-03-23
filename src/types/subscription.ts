export interface PlanConfig {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  limits: {
    receiptsPerMonth: number
    storageGB: number
  }
  stripePriceId: string | null
}

export interface BillingInfo {
  plan: PlanConfig
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'フリー',
    description: '個人事業主向けの基本プラン',
    price: 0,
    currency: 'jpy',
    interval: 'month',
    features: [
      '月30枚まで領収書スキャン',
      '基本的な経費管理',
      'LINEからの送信',
    ],
    limits: { receiptsPerMonth: 30, storageGB: 1 },
    stripePriceId: null,
  },
  {
    id: 'standard',
    name: 'スタンダード',
    description: 'ビジネス向けの標準プラン',
    price: 2980,
    currency: 'jpy',
    interval: 'month',
    features: [
      '月200枚まで領収書スキャン',
      '財務ダッシュボード',
      'AI自動仕訳',
      'Google Drive自動保存',
      'メール取込み',
    ],
    limits: { receiptsPerMonth: 200, storageGB: 10 },
    stripePriceId: 'price_standard_monthly',
  },
  {
    id: 'premium',
    name: 'プレミアム',
    description: '法人向けの上位プラン',
    price: 9800,
    currency: 'jpy',
    interval: 'month',
    features: [
      '領収書スキャン無制限',
      '全機能利用可能',
      '財務指標分析',
      'コンサル連携機能',
      '優先サポート',
    ],
    limits: { receiptsPerMonth: -1, storageGB: 100 },
    stripePriceId: 'price_premium_monthly',
  },
]
