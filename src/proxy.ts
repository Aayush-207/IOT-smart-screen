import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Renamed from `middleware.ts` — Next.js 16 renamed the Middleware file
// convention to "Proxy" (see
// node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
// Behaviour is identical; only the file name and export changed.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run on every request except:
     * - _next/static, _next/image, favicon.ico (framework assets)
     * - api/*        (API routes do their own auth: /api/screens is a public
     *                 device endpoint, /api/cron/* is bearer-guarded)
     * - static image files
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
