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
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    console.error('顧客一覧取得エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.name?.trim()) return NextResponse.json({ error: '顧客名は必須です' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('customers')
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('顧客作成エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
