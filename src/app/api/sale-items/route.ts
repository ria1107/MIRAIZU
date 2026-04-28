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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
    if (!body.name?.trim()) return NextResponse.json({ error: '項目名は必須です' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('sale_items')
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        default_price: body.default_price ? Number(body.default_price) : null,
        description: body.description || null,
        is_active: true,
        sort_order: body.sort_order ?? 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('売上項目作成エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
