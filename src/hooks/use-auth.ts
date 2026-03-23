'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { USE_MOCKS } from '@/lib/utils/constants'
import type { User } from '@supabase/supabase-js'

const mockUser: User = {
  id: 'mock-user-001',
  email: 'demo@example.com',
  app_metadata: {},
  user_metadata: { display_name: 'デモユーザー' },
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00Z',
} as User

const mockProfile: Profile = {
  id: 'mock-user-001',
  display_name: 'デモユーザー',
  email: 'demo@example.com',
  company_name: '株式会社サンプル',
  fiscal_year_start: 4,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (USE_MOCKS) {
      setUser(mockUser)
      setProfile(mockProfile)
      setLoading(false)
      return
    }

    const supabase = createClient()

    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        let { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // プロフィールが無い場合は自動作成
        if (!data) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
              company_name: null,
              fiscal_year_start: 4,
            })
            .select()
            .single()
          data = newProfile
        }

        setProfile(data)
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(data)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    if (USE_MOCKS) {
      window.location.href = '/login'
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return { user, profile, loading, signOut }
}
