import { SignupForm } from '@/components/features/auth/signup-form'

export const metadata = { title: '新規登録 | MIRAIZU' }

export default function SignupPage() {
  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">MIRAIZU</h1>
        <h2 className="mt-2 text-lg text-gray-600">新規アカウント登録</h2>
      </div>
      <SignupForm />
    </>
  )
}
