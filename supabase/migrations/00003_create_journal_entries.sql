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
