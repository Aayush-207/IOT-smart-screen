import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected routes mapping
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isClubRoute = request.nextUrl.pathname.startsWith('/dashboard/club')
  const isHodRoute = request.nextUrl.pathname.startsWith('/dashboard/hod')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/dashboard/admin')
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login')

  // Not logged in and trying to access protected route
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Redirect authenticated users away from login
    if (isLoginRoute || request.nextUrl.pathname === '/') {
      // Fetch user profile to get role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      const role = profile?.role
      const url = request.nextUrl.clone()
      
      if (role === 'club') url.pathname = '/dashboard/club'
      else if (role === 'hod') url.pathname = '/dashboard/hod'
      else if (role === 'admin') url.pathname = '/dashboard/admin'
      else url.pathname = '/login'
      
      return NextResponse.redirect(url)
    }

    // Role-based protection for dashboards
    if (isDashboardRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = profile?.role
      
      if (isClubRoute && role !== 'club') {
         return NextResponse.redirect(new URL('/login', request.url))
      }
      if (isHodRoute && role !== 'hod') {
         return NextResponse.redirect(new URL('/login', request.url))
      }
      if (isAdminRoute && role !== 'admin') {
         return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  return supabaseResponse
}
