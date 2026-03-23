import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()

  // processing状態で止まっている古いレシートを削除
  const { data, error, count } = await supabase
    .from('receipts')
    .delete()
    .eq('status', 'processing')
    .select('id')

  return NextResponse.json({
    deleted: data?.length || 0,
    deletedIds: data?.map(r => r.id),
    error: error?.message || null,
  })
}
