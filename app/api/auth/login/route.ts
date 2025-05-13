import { NextRequest, NextResponse } from 'next/server';

// API route to handle LINE login
export async function POST(request: NextRequest) {
  try {
    // Get the ID token from the request body
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    // Forward the request to our backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://5.unayung.cc/api';
    console.log(`Calling backend auth endpoint: ${backendUrl}/auth/line`);

    const response = await fetch(`${backendUrl}/auth/line`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    // Get the response data
    const data = await response.json();
    console.log('Backend auth response status:', response.status);

    // If there's an error from the backend
    if (!response.ok) {
      console.error('Backend auth error:', data);
      // Include more details from the backend response
      return NextResponse.json(
        { 
          error: data.message || 'Authentication failed',
          detail: data.detail,
          status: response.status,
          lineData: data.lineData
        },
        { status: response.status }
      );
    }

    // Create cookies for session
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    };

    // Create response with cookies and data
    const responseObj = NextResponse.json({
      success: true,
      user: data.user,
      token: data.token // Send token back to client for storage in localStorage/sessionStorage
    });

    // Set cookies
    responseObj.cookies.set('user_session', data.token, cookieOptions);

    // If admin, set admin cookie
    if (data.user?.role === 'admin') {
      responseObj.cookies.set('admin_role', 'true', cookieOptions);
    }

    console.log('Login successful, returning user data and cookies');
    return responseObj;
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}