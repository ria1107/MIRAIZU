import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('sale_items')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    console.error('売上項目更新エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { error } = await admin
      .from('sale_items')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
    return NextResponse.json({ message: '削除しました' })
  } catch (e) {
    console.error('売上項目削除エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
