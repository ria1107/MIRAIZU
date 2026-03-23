'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, LayoutDashboard, Receipt, TrendingDown, TrendingUp, Settings, CreditCard } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/receipts', label: '領収書', icon: Receipt },
  { href: '/expenses', label: '経費', icon: TrendingDown },
  { href: '/sales', label: '売上', icon: TrendingUp },
  { href: '/subscription', label: 'プラン', icon: CreditCard },
  { href: '/settings', label: '設定', icon: Settings },
]

export function Header() {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="md:hidden text-lg font-bold text-gray-900">MIRAIZU</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{profile?.display_name || profile?.email}</span>
          <button onClick={signOut} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="ログアウト">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-gray-200 bg-white px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
