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
  
  // Set the auth cookie
  response.cookies.set('user_session', authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });
  
  // Also get user data and set admin cookie if needed
  try {
    // Decode the JWT token to get user info
    const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    
    if (payload.role === 'admin') {
      response.cookies.set('admin_role', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });
    }
  } catch (error) {
    console.error('Error parsing token:', error);
  }
  
  return response;
}