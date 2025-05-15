import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the employee ID and LINE user ID from the request body
    const { employeeId, lineUserId } = await request.json();

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
      body: JSON.stringify({ employeeId, lineUserId }),
    });

    // Get the response data
    const data = await response.json();
    console.log('Backend employee binding response status:', response.status);

    // If there's an error from the backend
    if (!response.ok) {
      console.error('Backend employee binding error:', data);
      return NextResponse.json(
        { error: data.message || 'Employee ID binding failed' },
        { status: response.status }
      );
    }

    // Create response with user data and token
    console.log('Employee ID binding successful, returning user data and token');
    return NextResponse.json({
      success: true,
      user: data.user,
      token: data.token // Send token back to client for storage in localStorage/sessionStorage
    });
  } catch (error) {
    console.error('Error in employee ID binding route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}