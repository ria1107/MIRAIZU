-- line_connect_codes テーブル
-- Supabase SQL Editorで実行してください

CREATE TABLE IF NOT EXISTS line_connect_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_connect_codes_code ON line_connect_codes(code);
CREATE INDEX IF NOT EXISTS idx_line_connect_codes_user_id ON line_connect_codes(user_id);

-- 既存テーブルのFKがprofiles参照の場合は修正
-- (テーブルが既に存在していてFKが profiles を参照している場合のみ実行)
-- ALTER TABLE line_connect_codes DROP CONSTRAINT IF EXISTS line_connect_codes_user_id_fkey;
-- ALTER TABLE line_connect_codes ADD CONSTRAINT line_connect_codes_user_id_fkey
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
