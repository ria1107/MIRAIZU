-- ============================================
-- AI財務サポーター - 全テーブル作成SQL
-- Supabase SQL Editorにコピペして実行してください
-- ============================================

-- 1. profiles テーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  company_name TEXT,
  fiscal_year_start INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分のプロフィールのみ閲覧・編集可"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ユーザー登録時にプロフィールを自動作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. receipts テーブル
CREATE TYPE receipt_status AS ENUM ('pending', 'processing', 'analyzed', 'confirmed', 'error');
CREATE TYPE receipt_type AS ENUM ('expense', 'sales');

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status receipt_status DEFAULT 'pending',
  receipt_type receipt_type DEFAULT 'expense',
  original_file_url TEXT,
  google_drive_file_id TEXT,
  google_drive_url TEXT,
  file_name TEXT,
  mime_type TEXT,
  vendor_name TEXT,
  amount INTEGER,
  tax_amount INTEGER,
  transaction_date DATE,
  description TEXT,
  category TEXT,
  payment_method TEXT,
  raw_ai_response JSONB,
  line_message_id TEXT,
  source TEXT DEFAULT 'line',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_transaction_date ON receipts(transaction_date);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の領収書のみ"
  ON receipts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. journal_entries テーブル
CREATE TYPE entry_side AS ENUM ('debit', 'credit');

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  side entry_side NOT NULL,
  account_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_receipt_id ON journal_entries(receipt_id);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分の仕訳のみ" ON journal_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. subscriptions テーブル
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT,
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自分のサブスクリプションのみ" ON subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. line_connections テーブル
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

-- 6. account_categories テーブル
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

-- 7. 初期データ（デフォルト勘定科目）
INSERT INTO account_categories (user_id, name, type, is_default, sort_order) VALUES
  (NULL, '消耗品費', 'expense', TRUE, 1),
  (NULL, '旅費交通費', 'expense', TRUE, 2),
  (NULL, '通信費', 'expense', TRUE, 3),
  (NULL, '接待交際費', 'expense', TRUE, 4),
  (NULL, '水道光熱費', 'expense', TRUE, 5),
  (NULL, '地代家賃', 'expense', TRUE, 6),
  (NULL, '保険料', 'expense', TRUE, 7),
  (NULL, '租税公課', 'expense', TRUE, 8),
  (NULL, '減価償却費', 'expense', TRUE, 9),
  (NULL, '広告宣伝費', 'expense', TRUE, 10),
  (NULL, '福利厚生費', 'expense', TRUE, 11),
  (NULL, '修繕費', 'expense', TRUE, 12),
  (NULL, '外注費', 'expense', TRUE, 13),
  (NULL, '会議費', 'expense', TRUE, 14),
  (NULL, '支払手数料', 'expense', TRUE, 15),
  (NULL, '雑費', 'expense', TRUE, 16),
  (NULL, '売上高', 'revenue', TRUE, 100);
