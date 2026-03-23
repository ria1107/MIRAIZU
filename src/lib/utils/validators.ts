import { z } from 'zod'

export const receiptCreateSchema = z.object({
  vendor_name: z.string().min(1, '取引先名は必須です'),
  amount: z.number().int().min(0, '金額は0以上の整数で入力してください'),
  tax_amount: z.number().int().min(0).optional(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください'),
  description: z.string().optional(),
  category: z.string().min(1, '勘定科目は必須です'),
  payment_method: z.string().optional(),
  receipt_type: z.enum(['expense', 'sales']),
})

export const receiptUpdateSchema = receiptCreateSchema.partial()

export const profileUpdateSchema = z.object({
  display_name: z.string().min(1, '表示名は必須です').optional(),
  company_name: z.string().optional(),
  fiscal_year_start: z.number().int().min(1).max(12).optional(),
})

export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
})

export const signupSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  confirmPassword: z.string(),
  display_name: z.string().min(1, '表示名は必須です'),
  company_name: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
})

export type ReceiptCreateInput = z.infer<typeof receiptCreateSchema>
export type ReceiptUpdateInput = z.infer<typeof receiptUpdateSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
