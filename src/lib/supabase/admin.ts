import { createClient } from '@supabase/supabase-js'

// サービスロールキーを使用（RLSをバイパス）
// LINE Webhookなど、ユーザー認証コンテキストが無い場面で使用
// NOTE: supabase gen types で生成した型に差し替え後、Database型パラメータを追加する
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
