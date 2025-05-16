import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

// API route to handle logout
export async function POST(request: NextRequest) {
  try {
    console.log('Processing logout request');

    // Check if we should redirect directly
    const url = new URL(request.url);
    const shouldRedirect = url.searchParams.has('redirect');

    // Call backend to clear session if needed
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://5.unayung.cc/api';
    try {
      await fetch(`${backendUrl}/auth/logout`, {
        method: 'POST',
      });
      console.log('Backend logout request completed');
    } catch (backendError) {
      // If backend call fails, still proceed with local logout
      console.error('Backend logout error (continuing with local logout):', backendError);
    }

    // If redirect is requested, respond with HTML that will redirect and clear localStorage/sessionStorage
    if (shouldRedirect) {
      console.log('Performing immediate redirect after logout');

      // Create HTML response that will clear client storage and redirect
      const response = new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>登出中...</title>
            <meta http-equiv="refresh" content="0;url=/?logout=true" />
            <script>
              // Clear all storage completely
              try {
                // Clear specific auth-related keys first
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                localStorage.removeItem('authenticated');
                localStorage.removeItem('auto_login_processed');
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('authenticated');
                sessionStorage.removeItem('auto_login_processed');
                sessionStorage.removeItem('processed_code');
                sessionStorage.removeItem('auth_redirect');
                sessionStorage.removeItem('on_binding_page');
                
                // Set a flag to prevent auto-login on redirect
                sessionStorage.setItem('prevent_auto_login', 'true');
                
                // Then clear all storage
                sessionStorage.clear();
                localStorage.clear();
                
                // Also try to log out from LINE LIFF if available
                const isInLiffBrowser = window.liff && typeof window.liff.isInClient === 'function' && window.liff.isInClient();
                
                if (isInLiffBrowser) {
                  console.log("Detected LIFF browser, using special logout procedure");
                  
                  // In LIFF browser, we need to first load LIFF, then try to log out
                  if (typeof window.liff.logout === 'function') {
                    try {
                      window.liff.logout();
                      console.log("LINE LIFF logout successful");
                    } catch (e) {
                      console.error("LINE LIFF logout error:", e);
                    }
                  }
                  
                  // For LIFF browser, we need to reload the page to ensure a clean state
                  window.location.replace('/?logout=true&ts=' + new Date().getTime());
                } else {
                  // Standard browser - redirect to homepage with logout parameter
                  window.location.href = '/?logout=true';
                }
              } catch (e) {
                console.error("Error during logout cleanup:", e);
                // Fallback redirect
                window.location.href = '/?logout=true';
              }
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
      
      // Clear the auth cookie
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Immediately expire
        path: '/'
      });
      
      return response;
    } else {
      // Standard JSON response for API calls
      console.log('Logout successful, returning JSON response');
      const response = NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      });
      
      // Clear the auth cookie
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Immediately expire
        path: '/'
      });
      
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