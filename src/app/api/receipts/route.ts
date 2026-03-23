import { NextRequest, NextResponse } from 'next/server'
import { USE_MOCKS } from '@/lib/utils/constants'
import { mockReceipts } from '@/mocks/receipts'

export async function GET(request: NextRequest) {
  if (USE_MOCKS) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    let results = [...mockReceipts]
    if (status) results = results.filter(r => r.status === status)
    if (search) results = results.filter(r => r.vendor_name?.includes(search) || r.description?.includes(search))
    return NextResponse.json({ receipts: results, total: results.length, page: 1, limit: 20, totalPages: 1 })
  }

  // TODO: Supabase実装
  return NextResponse.json({ receipts: [], total: 0, page: 1, limit: 20, totalPages: 0 })
}

export async function POST(request: NextRequest) {
  if (USE_MOCKS) {
    const body = await request.json()
    return NextResponse.json({ ...body, id: crypto.randomUUID(), status: 'pending', created_at: new Date().toISOString() }, { status: 201 })
  }

  // TODO: Supabase実装
  return NextResponse.json({ error: '未実装' }, { status: 501 })
}
