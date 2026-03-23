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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
