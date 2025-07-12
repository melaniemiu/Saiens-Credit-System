import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isJWTExpired, parseJWT } from './lib/jwt-verify'

// Check if mock mode is enabled
function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_API === 'true'
}

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
]

// Check if the request is from a LIFF browser
function isLiffBrowser(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  // LIFF browser user agents contain "Line/" followed by version and "LIFF"
  // Example: "Mozilla/5.0 ... Line/11.1.0 LIFF"
  return userAgent.includes('Line/') && userAgent.includes('LIFF')
}


export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path))
  const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path))

  // **MOCK MODE: Allow all access without authentication**
  if (isMockMode()) {
    console.log('🎭 Middleware: Mock mode enabled, allowing all access')
    return NextResponse.next()
  }

  // Check for redirect loop cookie
  const redirectCount = request.cookies.get('redirect_count')?.value
  if (redirectCount && parseInt(redirectCount) > 3) {
    console.log('Middleware: Too many redirects detected, breaking loop')
    // Clear the redirect count and allow the request
    const response = NextResponse.next()
    response.cookies.delete('redirect_count')
    return response
  }

  // Check for authentication - using cookie for navigation and JWT for API
  let isAuthenticated = false
  let isAdmin = false
  let tokenExpired = false

  // Check for authentication cookie (for navigation)
  const authCookie = request.cookies.get('auth-token')?.value

  // Check for authentication token in Authorization header or query params (for API)
  const authHeader = request.headers.get('authorization')
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const queryAuthToken = request.nextUrl.searchParams.get('auth_token')
  const hasLiffAuth = request.nextUrl.searchParams.has('liff_auth')
  const hasAuthBypass = request.nextUrl.searchParams.has('auth_bypass')

  // Check the token (from cookie, header, or query param)
  const token = authCookie || authToken || queryAuthToken
  if (token) {
    if (isJWTExpired(token)) {
      console.log('JWT token is expired')
      tokenExpired = true
    } else {
      isAuthenticated = true
      // Parse token to determine if user is admin
      const tokenPayload = parseJWT(token)
      isAdmin = tokenPayload?.role === 'admin'
    }
  }

  // Also check for special auth flags for LIFF or binding process
  if (!tokenExpired && (hasLiffAuth || hasAuthBypass)) {
    isAuthenticated = true
  }

  // Special handling for LIFF browser
  const isLiffRequest = isLiffBrowser(request)

  console.log(`Middleware: Path ${pathname}, Protected: ${isProtectedPath}, Admin: ${isAdminPath}`);
  console.log(`Middleware: LIFF browser: ${isLiffRequest}, Auth cookie: ${!!authCookie}, Auth header: ${!!authHeader}, Query auth: ${!!queryAuthToken || hasLiffAuth}`);
  console.log(`Middleware: Search params:`, request.nextUrl.searchParams.toString());
  console.log(`Middleware: Final auth status: ${isAuthenticated}`);

  // If we're on the home page with return_to parameter and not authenticated,
  // we're showing the login page - no need to redirect again
  if (pathname === '/' && request.nextUrl.searchParams.has('return_to') && !isAuthenticated) {
    console.log('Middleware: Already on login page with return_to, allowing request');
    return NextResponse.next();
  }

  // Only enforce protection on non-API routes
  if (!pathname.startsWith('/api')) {
    // Special handling for LIFF browser authentication
    if (isLiffRequest) {
      // Don't block the home page for LIFF browsers - let auto-login happen
      if (pathname === '/' && request.nextUrl.searchParams.has('needs_liff_auth')) {
        console.log('Middleware: Allowing LIFF browser to access home page for auto-login');
        return NextResponse.next();
      }

      // Allow dashboard access if coming from home page with successful auth
      if (pathname.startsWith('/dashboard') && request.headers.get('referer')?.includes(request.headers.get('host') || '')) {
        console.log('Middleware: Allowing LIFF browser dashboard access from internal redirect');
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

    // If token is expired, redirect to login
    if (tokenExpired) {
      console.log('Middleware: Token expired, redirecting to login')

      // Check if we're already on the home page to prevent redirect loops
      if (pathname === '/') {
        console.log('Middleware: Already on home page, allowing request to prevent loop')
        return NextResponse.next()
      }

      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('error', 'session_expired')

      if (isLiffRequest) {
        redirectUrl.searchParams.set('needs_liff_auth', 'true')
      }

      const response = NextResponse.redirect(redirectUrl)

      // Add headers to tell frontend to clear storage
      response.headers.set('X-Auth-Expired', 'true')

      // Clear the auth cookie
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Immediately expire
        path: '/'
      });

      return response
    }

    // If the path is protected and user is not authenticated, redirect to login
    if (isProtectedPath && !isAuthenticated) {
      // Special handling for auth bypass (like after employee binding)
      if (hasAuthBypass) {
        console.log('Middleware: Allowing access via auth bypass');
        return NextResponse.next();
      }

      // Special handling for LIFF browsers with auth params to prevent loops
      if (isLiffRequest) {
        // If LIFF browser just got redirected with auth token, allow access
        // The dashboard will handle storing the token
        if (queryAuthToken || hasLiffAuth) {
          console.log('Middleware: Allowing LIFF browser with auth params to protected route');
          return NextResponse.next();
        }

        // Prevent redirect loops for LIFF browsers
        if (request.headers.get('referer')?.includes('needs_liff_auth=true')) {
          console.log('Middleware: Preventing redirect loop for LIFF browser');
          return NextResponse.next();
        }
      }

      // Check if we're coming from a login redirect to prevent loops
      const referer = request.headers.get('referer');
      const hasReturnTo = request.nextUrl.searchParams.has('return_to');

      // If we're being redirected from home page with return_to, it's likely a loop
      if (referer && referer.includes('?return_to=') && hasReturnTo) {
        console.log('Middleware: Preventing redirect loop - detected circular redirect pattern');
        return NextResponse.next();
      }

      // Additional loop prevention - check if referer is the same URL we're about to redirect to
      if (referer) {
        const refererUrl = new URL(referer);
        const redirectPath = '/?return_to=' + encodeURIComponent(pathname);
        if (refererUrl.pathname + refererUrl.search === redirectPath) {
          console.log('Middleware: Preventing redirect loop - referer matches redirect target');
          return NextResponse.next();
        }
      }

      // Don't redirect if we're already at the home/login page to prevent infinite loops
      if (pathname !== '/') {
        console.log('Middleware: Redirecting to login page due to missing authentication');
        console.log('Middleware: Current URL:', request.url);

        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('return_to', pathname);

        // For LIFF browser, add a special parameter to indicate it needs token-based auth
        if (isLiffRequest) {
          redirectUrl.searchParams.set('needs_liff_auth', 'true');
          console.log('Middleware: LIFF redirect to:', redirectUrl.toString());
        }

        const response = NextResponse.redirect(redirectUrl);

        // Increment redirect count cookie
        const currentCount = parseInt(redirectCount || '0');
        response.cookies.set('redirect_count', (currentCount + 1).toString(), {
          httpOnly: true,
          maxAge: 60 // Expire after 60 seconds
        });

        return response;
      }
    }

    // If authenticated via query param (for LIFF browser or after binding), allow request to proceed
    // The page should handle storing the token in localStorage/sessionStorage
    if (isProtectedPath && isAuthenticated && (queryAuthToken || hasAuthBypass)) {
      console.log('Middleware: Allowing access with auth token in query or auth bypass');
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
