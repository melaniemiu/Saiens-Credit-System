import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the employee ID, LINE user ID, and profile picture from the request body
    const { employeeId, lineUserId, profilePicture } = await request.json();

    if (!employeeId || !lineUserId) {
      return NextResponse.json(
        { error: 'Employee ID and LINE user ID are required' }, 
        { status: 400 }
      );
    }

    // Forward the request to our backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://5.unayung.cc/api';
    console.log(`Calling backend employee binding endpoint: ${backendUrl}/auth/bind-employee`);

    const response = await fetch(`${backendUrl}/auth/bind-employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ employeeId, lineUserId, profilePicture }),
    });

    // Get the response data
    const data = await response.json();
    console.log('Backend employee binding response status:', response.status);

    // If there's an error from the backend
    if (!response.ok) {
      console.error('Backend employee binding error:', data);
      // Forward all error data from backend
      return NextResponse.json(
        { 
          error: data.error || data.message || 'Employee ID binding failed',
          message: data.message || data.error || 'Employee ID binding failed',
          detail: data.detail || data.message || data.error
        },
        { status: response.status }
      );
    }

    // Create response with user data and token
    console.log('Employee ID binding successful, returning user data and token');
    const jsonResponse = NextResponse.json({
      success: true,
      user: data.user,
      token: data.token // Send token back to client for storage in localStorage/sessionStorage
    });

    // Also set httpOnly cookie for navigation
    jsonResponse.cookies.set('auth-token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    console.log('Set auth cookie for navigation after employee binding');
    return jsonResponse;
  } catch (error) {
    console.error('Error in employee ID binding route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}