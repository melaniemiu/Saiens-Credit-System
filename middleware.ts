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

// Define paths that should be accessible without authentication
const PUBLIC_PATHS = [
  '/',
  '/bind',
  '/bind-employee',
]

// Check if the request is from a LIFF browser
function isLiffBrowser(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  // LIFF browser user agents typically contain "Line" or "LIFF"
  return userAgent.toLowerCase().includes('line')
}

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path))
  const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path))

  // Check for authentication using multiple methods
  let isAuthenticated = false
  let isAdmin = false

  // First check cookies (works in regular browsers)
  const hasAuthCookie = request.cookies.has('user_session')
  const hasAdminCookie = request.cookies.has('admin_role')

  // Check for special query params (fallback for LIFF browser)
  const hasAuthBypass = request.nextUrl.searchParams.has('auth_bypass')
  const hasAuthToken = request.nextUrl.searchParams.has('auth_token')

  // Check for LIFF-specific auth parameter
  const hasLiffAuth = request.nextUrl.searchParams.has('liff_auth')

  // Determine authentication status
  isAuthenticated = hasAuthCookie || hasAuthBypass || hasAuthToken || hasLiffAuth
  isAdmin = hasAdminCookie

  // Special handling for LIFF browser
  const isLiffRequest = isLiffBrowser(request)

  console.log(`Middleware: Path ${pathname}, Protected: ${isProtectedPath}, Admin: ${isAdminPath}`);
  console.log(`Middleware: LIFF browser: ${isLiffRequest}, Auth cookie: ${hasAuthCookie}, Query auth: ${hasAuthToken || hasLiffAuth}`);
  console.log(`Middleware: Search params:`, request.nextUrl.searchParams.toString());
  console.log(`Middleware: Final auth status: ${isAuthenticated}`);

  // Only enforce protection on non-API routes
  if (!pathname.startsWith('/api')) {
    // Special handling for LIFF browser authentication
    if (isLiffRequest) {
      // Don't block the home page for LIFF browsers - let auto-login happen
      if (pathname === '/' && request.nextUrl.searchParams.has('needs_liff_auth')) {
        console.log('Middleware: Allowing LIFF browser to access home page for auto-login');
        return NextResponse.next();
      }
      
      // For protected paths in LIFF browser
      if (isProtectedPath) {
        // Check if this is a redirect from successful LIFF authentication
        const isFromLiffCallback = request.headers.get('referer')?.includes('liff.state') || 
                                  request.nextUrl.searchParams.has('liff.state')

        // Allow LIFF browser to access protected routes if coming from LIFF callback
        if (isFromLiffCallback) {
          console.log('Middleware: Allowing LIFF browser access from callback');
          return NextResponse.next()
        }

        // For LIFF browser, also check if we have LIFF query params
        if (request.nextUrl.searchParams.has('code') || request.nextUrl.searchParams.has('state')) {
          console.log('Middleware: Allowing LIFF browser with auth params');
          return NextResponse.next()
        }
      }
    }

    // If the path is protected and user is not authenticated, redirect to login
    if (isProtectedPath && !isAuthenticated) {
      // Don't redirect if already has needs_liff_auth flag to prevent loops
      if (isLiffRequest && request.headers.get('referer')?.includes('needs_liff_auth=true')) {
        console.log('Middleware: Preventing redirect loop for LIFF browser');
        return NextResponse.next();
      }
      
      // Don't redirect if we're already at the home/login page to prevent infinite loops
      if (pathname !== '/') {
        console.log('Middleware: Redirecting to login page due to missing authentication');
        console.log('Middleware: Current URL:', request.url);
        console.log('Middleware: Cookies:', request.cookies.getAll());
        
        // For LIFF browser, add a special parameter to indicate it needs token-based auth
        if (isLiffRequest) {
          const redirectUrl = new URL('/', request.url)
          redirectUrl.searchParams.set('needs_liff_auth', 'true')
          console.log('Middleware: LIFF redirect to:', redirectUrl.toString());
          return NextResponse.redirect(redirectUrl)
        }
        
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    
    // If authenticated via query param (for LIFF browser), allow request to proceed
    // The page should handle storing the token in cookies/localStorage
    if (isProtectedPath && isAuthenticated && hasAuthToken) {
      console.log('Middleware: Allowing access with auth token in query');
      return NextResponse.next()
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
     */
    '/((?!_next/static|_next/image|images|favicon.ico|api).*)',
  ],
}