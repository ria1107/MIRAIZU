CREATE TABLE line_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_line_connections_line_user_id ON line_connections(line_user_id);

ALTER TABLE line_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分のLINE連携のみ" ON line_connections FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE account_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE account_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "デフォルトまたは自分の科目を閲覧" ON account_categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "自分の科目のみ作成" ON account_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分の科目のみ更新" ON account_categories FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "自分の科目のみ削除" ON account_categories FOR DELETE
  USING (auth.uid() = user_id);
