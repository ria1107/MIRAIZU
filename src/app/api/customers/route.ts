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

    if (error) {
      console.error('顧客一覧取得エラー:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
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
    const name = body.name?.toString().trim()
    if (!name) return NextResponse.json({ error: '顧客名は必須です' }, { status: 400 })
    if (name.length > 200) return NextResponse.json({ error: '顧客名は200文字以内にしてください' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('customers')
      .insert({
        user_id: user.id,
        name,
        email: body.email ? String(body.email).slice(0, 255) : null,
        phone: body.phone ? String(body.phone).slice(0, 50) : null,
        address: body.address ? String(body.address).slice(0, 500) : null,
        notes: body.notes ? String(body.notes).slice(0, 1000) : null,
      })
      .select()
      .single()

    if (error) {
      console.error('顧客作成エラー:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('顧客作成エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
