import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define which paths should be protected
const PROTECTED_PATHS = [
  '/dashboard',
  '/dashboard/give-credit',
  '/dashboard/history',
]

// Define admin-only paths
const ADMIN_PATHS = [
  '/admin',
]

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path))

  // Check for authentication cookie
  const isAuthenticated = request.cookies.has('user_session')

  // Check for admin role cookie
  const isAdmin = request.cookies.has('admin_role')

  console.log(`Middleware: Path ${pathname}, Protected: ${isProtectedPath}, Admin: ${isAdminPath}`);
  console.log(`Middleware: Auth cookie: ${isAuthenticated}, Admin cookie: ${isAdmin}`);

  // Only enforce protection on non-API routes
  if (!pathname.startsWith('/api')) {
    // If the path is protected and user is not authenticated, redirect to login
    if (isProtectedPath && !isAuthenticated) {
      console.log('Middleware: Redirecting to login page due to missing authentication');
      return NextResponse.redirect(new URL('/', request.url))
    }

    // If the path is admin-only and user is not an admin, redirect to dashboard
    if (isAdminPath && (!isAuthenticated || !isAdmin)) {
      console.log('Middleware: Redirecting to dashboard due to missing admin privileges');
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Allow the request to proceed
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - Static files (/_next/, /images/, etc.)
     * - API routes (/api/)
     * - Root path (/)
     */
    '/((?!_next|images|api|$).*)',
  ],
}