export const STRIPE_PLANS = {
  free: { name: 'フリー', priceId: null },
  standard: { name: 'スタンダード', priceId: process.env.STRIPE_STANDARD_PRICE_ID || 'price_standard' },
  premium: { name: 'プレミアム', priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium' },
} as const
