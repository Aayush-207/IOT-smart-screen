import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DASHBOARD_BY_ROLE: Record<string, string> = {
  submitter: '/dashboard/submitter',
  hod: '/dashboard/hod',
  admin: '/dashboard/admin',
  emergency: '/dashboard/admin',
}

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
          cookiesToSet.forEach(({ name, value, options: _options }) => request.cookies.set(name, value))
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

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch (err) {
    console.warn('Middleware auth error:', err)
  }

  const path = request.nextUrl.pathname
  const isDashboardRoute = path.startsWith('/dashboard')
  const isSubmitterRoute = path.startsWith('/dashboard/submitter')
  const isHodRoute = path.startsWith('/dashboard/hod')
  const isAdminRoute = path.startsWith('/dashboard/admin')
  const isEmergencyRoute = path.startsWith('/dashboard/admin/emergency')
  // Areas an Emergency Authority account must not reach (blueprint Part 8:
  // they don't manage devices and don't approve content).
  const isAdminOnlyArea =
    path.startsWith('/dashboard/admin/fleet') || path.startsWith('/dashboard/admin/approvals')
  const isLoginRoute = path.startsWith('/login')

  // Not logged in and trying to access protected route or root
  if (!user && (isDashboardRoute || path === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    let profile = null
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      profile = data
    } catch (err) {
      console.warn('Middleware profile fetch error:', err)
    }

    const role = profile?.role

    // Redirect authenticated users away from login / root
    if (isLoginRoute || path === '/') {
      const url = request.nextUrl.clone()
      url.pathname = (role && DASHBOARD_BY_ROLE[role]) || '/dashboard/submitter'
      return NextResponse.redirect(url)
    }

    // Role-based protection for dashboards
    if (isDashboardRoute) {
      if (isSubmitterRoute && role !== 'submitter') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      if (isHodRoute && role !== 'hod') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      if (isAdminRoute && role !== 'admin' && role !== 'emergency') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      if (isEmergencyRoute && role !== 'emergency') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      }
      if (isAdminOnlyArea && role === 'emergency') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      }
    }
  }

  return supabaseResponse
}
