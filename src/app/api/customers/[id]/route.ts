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
      .from('customers')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      console.error('顧客更新エラー:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (e) {
    console.error('顧客更新エラー:', e)
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
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('顧客削除エラー:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json({ message: '削除しました' })
  } catch (e) {
    console.error('顧客削除エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
