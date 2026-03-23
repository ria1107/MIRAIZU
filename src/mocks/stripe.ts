import { Subscription } from '@/types/database'

export const mockSubscription: Subscription = {
  id: 'mock-sub-001',
  user_id: 'mock-user-001',
  stripe_customer_id: 'cus_mock_001',
  stripe_subscription_id: 'sub_mock_001',
  plan_id: 'standard',
  status: 'active',
  current_period_start: '2025-01-01T00:00:00Z',
  current_period_end: '2025-02-01T00:00:00Z',
  cancel_at_period_end: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

export function mockCreateCheckoutSession(): { url: string } {
  return {
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription?success=true`,
  }
}

export function mockCreatePortalSession(): { url: string } {
  return {
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription`,
  }
}
