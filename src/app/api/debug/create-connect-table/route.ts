import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 連携コードテーブルを作成するワンタイムエンドポイント
export async function GET() {
  const supabase = createAdminClient()

  // RPC経由でSQL実行
  const { error } = await supabase.rpc('exec_sql' as never, {
    sql: `
      CREATE TABLE IF NOT EXISTS line_connect_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_connect_codes_code ON line_connect_codes(code);
      ALTER TABLE line_connect_codes ENABLE ROW LEVEL SECURITY;
    ` as never,
  })

  if (error) {
    // RPCが無い場合は直接REST APIで試行
    return NextResponse.json({
      error: error.message,
      hint: 'Supabase SQL EditorでSQL実行してください',
      sql: `CREATE TABLE IF NOT EXISTS line_connect_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_connect_codes_code ON line_connect_codes(code);
ALTER TABLE line_connect_codes ENABLE ROW LEVEL SECURITY;`,
    })
  }

  return NextResponse.json({ success: true })
}
