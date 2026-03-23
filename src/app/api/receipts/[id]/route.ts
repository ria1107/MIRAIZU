import { NextRequest, NextResponse } from 'next/server'
import { USE_MOCKS } from '@/lib/utils/constants'
import { mockReceipts } from '@/mocks/receipts'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (USE_MOCKS) {
    const receipt = mockReceipts.find(r => r.id === id)
    if (!receipt) return NextResponse.json({ error: '見つかりません' }, { status: 404 })
    return NextResponse.json(receipt)
  }
  return NextResponse.json({ error: '未実装' }, { status: 501 })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (USE_MOCKS) {
    const body = await request.json()
    const receipt = mockReceipts.find(r => r.id === id)
    if (!receipt) return NextResponse.json({ error: '見つかりません' }, { status: 404 })
    return NextResponse.json({ ...receipt, ...body, updated_at: new Date().toISOString() })
  }
  return NextResponse.json({ error: '未実装' }, { status: 501 })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (USE_MOCKS) {
    return NextResponse.json({ message: `領収書 ${id} を削除しました` })
  }
  return NextResponse.json({ error: '未実装' }, { status: 501 })
}
