import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()

  // ユーザー一覧
  const { data: users } = await supabase.auth.admin.listUsers()
  const userList = (users?.users || []).map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
  }))

  // LINE連携一覧
  const { data: lineConns } = await supabase
    .from('line_connections')
    .select('user_id, line_user_id, display_name, is_active')

  // レシート一覧（最新10件）
  const { data: receipts } = await supabase
    .from('receipts')
    .select('id, user_id, status, vendor_name, amount, source, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    users: userList,
    lineConnections: lineConns,
    recentReceipts: receipts,
  })
}
