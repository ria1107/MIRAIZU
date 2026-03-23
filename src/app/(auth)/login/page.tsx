import { LoginForm } from '@/components/features/auth/login-form'

export const metadata = { title: 'ログイン | MIRAIZU' }

export default function LoginPage() {
  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">MIRAIZU</h1>
        <h2 className="mt-2 text-lg text-gray-600">アカウントにログイン</h2>
      </div>
      <LoginForm />
    </>
  )
}
