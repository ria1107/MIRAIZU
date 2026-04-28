import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// プロフィール取得
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ profile, email: user.email })
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// プロフィール更新
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { display_name, company_name, fiscal_year_start } = body

    const fiscalMonth = parseInt(fiscal_year_start)
    if (isNaN(fiscalMonth) || fiscalMonth < 1 || fiscalMonth > 12) {
      return NextResponse.json({ error: '決算開始月は1〜12の数字で入力してください' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .update({
        display_name: display_name ? String(display_name).slice(0, 100) : null,
        company_name: company_name ? String(company_name).slice(0, 200) : null,
        fiscal_year_start: fiscalMonth,
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('プロフィール更新エラー:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
