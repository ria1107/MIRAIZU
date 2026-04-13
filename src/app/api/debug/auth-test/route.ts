import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 管理者ユーザーでパスワード認証テスト
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'shogo.n.work@gmail.com',
      password: 'admin1234',
    })

    if (signInError) {
      return NextResponse.json({
        step: 'signIn',
        error: signInError.message,
        hint: '認証に失敗しました。メール確認が必要か、パスワードが間違っています。',
      })
    }

    // ユーザーIDでレシートを直接取得（RLSバイパス）
    const userId = signInData.user?.id
    const { data: receipts, error: receiptError } = await supabase
      .from('receipts')
      .select('id, status, vendor_name, amount')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
      .limit(5)

    // プロフィール確認
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId!)
      .single()

    return NextResponse.json({
      success: true,
      userId,
      email: signInData.user?.email,
      emailConfirmed: signInData.user?.email_confirmed_at,
      hasSession: !!signInData.session,
      profile: profile || null,
      profileError: profileError?.message || null,
      receipts: receipts || [],
      receiptError: receiptError?.message || null,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
