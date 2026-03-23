'use client'

import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/types/subscription'
import { formatCurrency } from '@/lib/utils/format'
import { Check } from 'lucide-react'

export default function SubscriptionPage() {
  const currentPlan = 'standard'

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">プラン管理</h2>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan
          return (
            <Card key={plan.id} className={`relative ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
              {isCurrent && (
                <Badge variant="info" className="absolute -top-2 left-4">現在のプラン</Badge>
              )}
              <div className="pt-2">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price === 0 ? '無料' : formatCurrency(plan.price)}
                  </span>
                  {plan.price > 0 && <span className="text-sm text-gray-500">/月</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>利用中</Button>
                  ) : (
                    <Button variant={plan.id === 'premium' ? 'primary' : 'outline'} className="w-full">
                      {plan.price === 0 ? 'ダウングレード' : 'アップグレード'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
