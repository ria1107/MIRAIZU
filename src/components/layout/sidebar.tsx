'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, TrendingDown, TrendingUp, Settings, CreditCard, Users } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/receipts', label: '領収書', icon: Receipt },
  { href: '/expenses', label: '経費', icon: TrendingDown },
  { href: '/sales', label: '売上', icon: TrendingUp },
  { href: '/customers', label: '顧客', icon: Users },
  { href: '/subscription', label: 'プラン', icon: CreditCard },
  { href: '/settings', label: '設定', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">MIRAIZU</h1>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
