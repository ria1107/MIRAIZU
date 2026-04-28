import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_STATUSES = ['pending', 'processing', 'analyzed', 'confirmed', 'error']
const VALID_RECEIPT_TYPES = ['expense', 'sales']

// raw_ai_response はサーバー内部用。クライアントには返さない
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeReceipt(r: any) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { raw_ai_response, ...safe } = r
  return safe
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = admin
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status && VALID_STATUSES.includes(status)) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('レシート取得エラー:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    let receipts = (data || []).map(sanitizeReceipt)

    if (search) {
      const q = search.slice(0, 100)
      receipts = receipts.filter(
        r => r.vendor_name?.includes(q) || r.description?.includes(q)
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

    const receiptType = VALID_RECEIPT_TYPES.includes(body.receipt_type) ? body.receipt_type : 'sales'
    const amount = body.amount != null ? Number(body.amount) : null
    const taxAmount = body.tax_amount != null ? Number(body.tax_amount) : null

    if (amount != null && (isNaN(amount) || amount < 0)) {
      return NextResponse.json({ error: '金額が不正です' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('receipts')
      .insert({
        user_id: user.id,
        receipt_type: receiptType,
        status: 'confirmed',
        vendor_name: body.vendor_name ? String(body.vendor_name).slice(0, 255) : null,
        amount,
        tax_amount: taxAmount != null && !isNaN(taxAmount) ? taxAmount : null,
        transaction_date: body.transaction_date || null,
        description: body.description ? String(body.description).slice(0, 1000) : null,
        category: body.category ? String(body.category).slice(0, 100) : null,
        payment_method: body.payment_method ? String(body.payment_method).slice(0, 100) : null,
        source: 'web_upload',
      })
      .select()
      .single()

    if (error || !data) {
      console.error('レシート作成エラー:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
    return NextResponse.json(sanitizeReceipt(data), { status: 201 })
  } catch (e) {
    console.error('レシート作成エラー:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
