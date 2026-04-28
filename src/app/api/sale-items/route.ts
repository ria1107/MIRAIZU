import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('sale_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order')
      .order('created_at')

    if (error) {
      console.error('売上項目一覧取得エラー:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('売上項目一覧取得エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const name = body.name?.toString().trim()
    if (!name) return NextResponse.json({ error: '項目名は必須です' }, { status: 400 })
    if (name.length > 200) return NextResponse.json({ error: '項目名は200文字以内にしてください' }, { status: 400 })

    const defaultPrice = body.default_price ? Number(body.default_price) : null
    if (defaultPrice != null && (isNaN(defaultPrice) || defaultPrice < 0)) {
      return NextResponse.json({ error: '金額が不正です' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('sale_items')
      .insert({
        user_id: user.id,
        name,
        default_price: defaultPrice,
        description: body.description ? String(body.description).slice(0, 500) : null,
        is_active: true,
        sort_order: body.sort_order != null ? Number(body.sort_order) : 0,
      })
      .select()
      .single()

    if (error) {
      console.error('売上項目作成エラー:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('売上項目作成エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
