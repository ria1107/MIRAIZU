'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { USE_MOCKS } from '@/lib/utils/constants'

export function SignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', display_name: '', company_name: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (formData.password !== formData.confirmPassword) { setError('パスワードが一致しません'); return }
    if (formData.password.length < 8) { setError('パスワードは8文字以上で入力してください'); return }
    setLoading(true)

    if (USE_MOCKS) { router.push('/dashboard'); return }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: formData.email, password: formData.password,
        options: { data: { display_name: formData.display_name, company_name: formData.company_name } },
      })
      if (error) { setError(error.message); return }
      router.push('/login?message=registered')
    } catch {
      setError('登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      <div className="space-y-4">
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">表示名 <span className="text-red-500">*</span></label>
          <input id="display_name" name="display_name" type="text" required value={formData.display_name} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">会社名・屋号</label>
          <input id="company_name" name="company_name" type="text" value={formData.company_name} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">メールアドレス <span className="text-red-500">*</span></label>
          <input id="signup-email" name="email" type="email" required value={formData.email} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="example@mail.com" />
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">パスワード <span className="text-red-500">*</span></label>
          <input id="signup-password" name="password" type="password" required value={formData.password} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="8文字以上" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">パスワード（確認） <span className="text-red-500">*</span></label>
          <input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="パスワードをもう一度" />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {loading ? '登録中...' : 'アカウント作成'}
      </button>
      <div className="text-center text-sm text-gray-600">
        既にアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">ログイン</Link>
      </div>
      {USE_MOCKS && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm text-center">
          開発モード: 任意の情報で登録できます
        </div>
      )}
    </form>
  )
}
