import { NextRequest, NextResponse } from 'next/server';

// API route to handle LIFF browser redirects with authentication
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const authToken = searchParams.get('auth_token');
  const destination = searchParams.get('destination') || '/dashboard';
  
  console.log('[LIFF Redirect] Incoming request with token:', authToken ? 'present' : 'missing');
  console.log('[LIFF Redirect] Destination:', destination);
  
  if (!authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Create a response that redirects to the destination
  const redirectUrl = new URL(destination, request.url);
  // Add auth token as query param for LIFF browser to bypass middleware check
  redirectUrl.searchParams.set('auth_token', authToken);
  redirectUrl.searchParams.set('liff_auth', 'true');
  console.log('[LIFF Redirect] Redirecting to:', redirectUrl.toString());
  const response = NextResponse.redirect(redirectUrl);
  
  // No cookies needed - the auth_token in query params will be handled by the client
  
  return response;
}