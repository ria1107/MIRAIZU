import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthRoute = pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/callback')
  const isApiRoute = pathname.startsWith('/api')
  const isTopPage = pathname === '/'

  // Supabaseのセッションクッキーが存在するか確認（外部API呼び出しなし）
  // @supabase/ssr v0.5以降はCookieを分割保存するため includes で判定
  // 例: sb-xxx-auth-token, sb-xxx-auth-token.0, sb-xxx-auth-token.1
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )

  // 未ログインでダッシュボード系にアクセス → ログインへ
  if (!hasSession && !isAuthRoute && !isApiRoute && !isTopPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ログイン済みでログイン/登録ページにアクセス → ダッシュボードへ
  if (hasSession && isAuthRoute && !pathname.startsWith('/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
