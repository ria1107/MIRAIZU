'use client'

import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, Link as LinkIcon } from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    display_name: 'デモユーザー',
    company_name: '株式会社サンプル',
    email: 'demo@example.com',
    fiscal_year_start: '4',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">設定</h2>

      <Card>
        <CardTitle>プロフィール</CardTitle>
        <div className="mt-4 space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
            <input name="display_name" value={profile.display_name} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会社名・屋号</label>
            <input name="company_name" value={profile.company_name} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input name="email" value={profile.email} disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">決算開始月</label>
            <select name="fiscal_year_start" value={profile.fiscal_year_start} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}月</option>
              ))}
            </select>
          </div>
          <Button><Save className="w-4 h-4 mr-1" />保存</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>LINE連携</CardTitle>
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-4">
            LINEアカウントを連携すると、LINEから領収書画像を送信して自動解析できます。
          </p>
          <Button variant="outline"><LinkIcon className="w-4 h-4 mr-1" />LINE連携を開始</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Google Drive連携</CardTitle>
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-4">
            解析済みの領収書画像をGoogle Driveに自動保存します。
          </p>
          <Button variant="outline"><LinkIcon className="w-4 h-4 mr-1" />Google Drive連携を設定</Button>
        </div>
      </Card>
    </div>
  )
}
