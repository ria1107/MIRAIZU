export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ReceiptStatus = 'pending' | 'processing' | 'analyzed' | 'confirmed' | 'error'
export type ReceiptType = 'expense' | 'sales'
export type EntrySide = 'debit' | 'credit'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
export type AccountType = 'expense' | 'revenue' | 'asset' | 'liability'

export interface Profile {
  id: string
  display_name: string | null
  email: string | null
  company_name: string | null
  fiscal_year_start: number
  created_at: string
  updated_at: string
}

export interface LineConnection {
  id: string
  user_id: string
  line_user_id: string
  display_name: string | null
  is_active: boolean
  connected_at: string
  updated_at: string
}

export interface Receipt {
  id: string
  user_id: string
  status: ReceiptStatus
  receipt_type: ReceiptType
  original_file_url: string | null
  google_drive_file_id: string | null
  google_drive_url: string | null
  file_name: string | null
  mime_type: string | null
  vendor_name: string | null
  amount: number | null
  tax_amount: number | null
  transaction_date: string | null
  description: string | null
  category: string | null
  payment_method: string | null
  raw_ai_response: Json | null
  line_message_id: string | null
  source: 'line' | 'web_upload'
  created_at: string
  updated_at: string
}

export interface JournalEntry {
  id: string
  user_id: string
  receipt_id: string | null
  transaction_date: string
  side: EntrySide
  account_name: string
  amount: number
  description: string | null
  is_confirmed: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan_id: string | null
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface AccountCategory {
  id: string
  user_id: string | null
  name: string
  type: AccountType
  is_default: boolean
  sort_order: number
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      line_connections: {
        Row: LineConnection
        Insert: Omit<LineConnection, 'id' | 'connected_at' | 'updated_at'>
        Update: Partial<Omit<LineConnection, 'id' | 'connected_at'>>
      }
      receipts: {
        Row: Receipt
        Insert: Omit<Receipt, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Receipt, 'id' | 'created_at'>>
      }
      journal_entries: {
        Row: JournalEntry
        Insert: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<JournalEntry, 'id' | 'created_at'>>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>
      }
      account_categories: {
        Row: AccountCategory
        Insert: Omit<AccountCategory, 'id' | 'created_at'>
        Update: Partial<Omit<AccountCategory, 'id' | 'created_at'>>
      }
    }
  }
}
