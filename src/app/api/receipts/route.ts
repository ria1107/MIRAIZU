import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // まずサーバーサイドでユーザーセッションを確認
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // admin clientでRLSバイパスして取得（確実にデータが返る）
    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = admin
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('レシート取得エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let receipts = data || []

    // 検索フィルタ（クライアント側）
    if (search) {
      receipts = receipts.filter(
        r => r.vendor_name?.includes(search) || r.description?.includes(search)
      )
    }

    return NextResponse.json({ receipts, total: receipts.length })
  } catch (e) {
    console.error('API receipts error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('receipts')
      .insert({
        user_id: user.id,
        receipt_type: body.receipt_type || 'sales',
        status: body.status || 'confirmed',
        vendor_name: body.vendor_name || null,
        amount: body.amount ? Number(body.amount) : null,
        tax_amount: body.tax_amount ? Number(body.tax_amount) : null,
        transaction_date: body.transaction_date || null,
        description: body.description || null,
        category: body.category || null,
        payment_method: body.payment_method || null,
        source: body.source || 'web_upload',
      })
      .select()
      .single()

    if (error || !data) return NextResponse.json({ error: '作成に失敗しました' }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('レシート作成エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
