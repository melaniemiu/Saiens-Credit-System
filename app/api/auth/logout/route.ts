import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

// API route to handle logout
export async function POST(request: NextRequest) {
  try {
    console.log('Processing logout request');

    // Check if we should redirect directly
    const url = new URL(request.url);
    const shouldRedirect = url.searchParams.has('redirect');

    // Clear authentication cookies
    const cookieOptions = {
      path: '/',
      maxAge: 0, // Expire immediately
    };

    // Call backend to clear session if needed
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://5.unayung.cc/api';
    try {
      await fetch(`${backendUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies
      });
      console.log('Backend logout request completed');
    } catch (backendError) {
      // If backend call fails, still proceed with local logout
      console.error('Backend logout error (continuing with local logout):', backendError);
    }

    // If redirect is requested, respond with HTML that will redirect and clear cookies in JavaScript
    // This approach avoids middleware auth checks during redirection
    if (shouldRedirect) {
      console.log('Performing immediate redirect after logout');

      // Create HTML response that will clear client storage and redirect
      const htmlResponse = new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>登出中...</title>
            <meta http-equiv="refresh" content="0;url=/?logout=true" />
            <script>
              // Clear all storage
              sessionStorage.clear();
              localStorage.clear();

              // Redirect to homepage with logout parameter
              window.location.href = '/?logout=true';
            </script>
          </head>
          <body style="font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f3f4f6;">
            <div style="text-align: center; padding: 2rem; background-color: white; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #059669; margin-bottom: 1rem;">登出中...</h2>
              <p>正在清除登入資訊，請稍候</p>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );

      // Clear auth cookies
      htmlResponse.cookies.delete('user_session', cookieOptions);
      htmlResponse.cookies.delete('admin_role', cookieOptions);

      return htmlResponse;
    } else {
      // Standard JSON response for API calls
      const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      });

      // Clear cookies
      response.cookies.delete('user_session', cookieOptions);
      response.cookies.delete('admin_role', cookieOptions);

      console.log('Logout successful, returning response with cleared cookies');
      return response;
    }
  } catch (error) {
    console.error('Error in logout route:', error);
    return NextResponse.json(
      { error: 'Internal server error during logout' },
      { status: 500 }
    );
  }
}