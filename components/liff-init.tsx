"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { setCurrentUser, isAuthenticated } from '@/lib/auth'
import { setAuthToken } from '@/lib/api'
import { initLiff, liff, isInLineBrowser } from '@/lib/liff-loader'

export function LiffInit() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoLoginProcessed, setAutoLoginProcessed] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Function to check if we're on a page that should skip auto-login
  const shouldSkipAutoLogin = () => {
    if (typeof window === 'undefined') return false;
    
    console.log('[LiffInit] Checking if should skip auto-login for path:', window.location.pathname);
    
    // Check URL path for binding pages
    const isBindPath = window.location.pathname === '/bind' || 
                      window.location.pathname === '/bind-employee';
                      
    // Check for binding page flag
    const hasBindFlag = sessionStorage.getItem('on_binding_page') === 'true';
    
    // Check for other special pages where auto-login should be skipped
    const isHomePage = window.location.pathname === '/';
    const hasLogoutParam = new URLSearchParams(window.location.search).has('logout');
    const hasNeedsLiffAuth = new URLSearchParams(window.location.search).has('needs_liff_auth');
    
    // If we're on the home page with logout param, skip auto-login
    if (isHomePage && hasLogoutParam) {
      console.log("[LiffInit] On home page with logout param, skipping auto-login");
      return true;
    }
    
    // If we're on home page with needs_liff_auth, don't skip - we need to handle auto-login
    if (isHomePage && hasNeedsLiffAuth) {
      console.log("[LiffInit] On home page with needs_liff_auth, proceeding with auto-login");
      return false;
    }
    
    return isBindPath || hasBindFlag;
  };

  // Using the centralized LIFF loader instead of implementing initialization here

  useEffect(() => {
    // Check if we should skip LIFF initialization on this page
    if (shouldSkipAutoLogin()) {
      console.log("[LiffInit] On page that should skip auto-login, skipping LIFF initialization");
      setIsLoading(false);
      return;
    }
    
    // Check if we're on the dashboard already
    const isOnDashboard = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard');
    
    // Check if we already have a valid authenticated session
    if (isAuthenticated()) {
      if (sessionStorage.getItem('auto_login_processed') === 'true') {
        console.log("User already authenticated and auto-login already processed, skipping LIFF initialization");
        setIsLoading(false);
        setAutoLoginProcessed(true);
        
        // If we're on dashboard and we already have auth, finish right away
        if (isOnDashboard) {
          console.log("Already on dashboard with auth, no redirection needed");
          return;
        }
      } else {
        // Has authentication but not marked as processed
        console.log("User authenticated but auto-login not marked as processed");
        sessionStorage.setItem('auto_login_processed', 'true');
        
        // If we're not on dashboard, redirect
        if (!isOnDashboard) {
          console.log("Redirecting to dashboard with existing auth");
          window.location.replace('/dashboard');
          return;
        }
      }
    }
    
    // Check if we're on the redirect URL with a code parameter
    const url = new URL(window.location.href)
    const hasAuthCode = url.searchParams.has('code')
    const hasState = url.searchParams.has('state')
    const isRedirect = hasAuthCode && hasState

    if (isRedirect) {
      console.log("Detected LINE login redirect, initializing LIFF...")
    }

    const initializeLiff = () => {
      // Use centralized LIFF loader
      initLiff()
        .then(success => {
          console.log("LIFF initialization result:", success ? "success" : "failed");
          if (!success) {
            setError("LIFF initialization failed");
            setIsLoading(false);
            return;
          }

          setIsInitialized(true);

          // Check if we already processed auto-login during this session
          const wasProcessed = sessionStorage.getItem('auto_login_processed') === 'true';
          
          // Check if user is already authenticated
          const hasValidAuth = isAuthenticated();
          
          if (wasProcessed && hasValidAuth) {
            console.log("🔵 Auto-login already processed and user is authenticated, skipping login process");
            setAutoLoginProcessed(true);
            setIsLoading(false);
            return;
          }

          // Now it's safe to check login state
          if (liff.isLoggedIn()) {
            console.log("🟢 User is logged in with LINE");
            
            // Check if we're in LIFF browser for special handling
            const isInLiffBrowser = liff.isInClient && liff.isInClient();

            // Try to get profile to verify login worked
            liff.getProfile()
              .then(profile => {
                console.log("✅ LINE Profile:", profile);
                console.log("✅ LINE User ID:", profile.userId);
                console.log("✅ LINE Display Name:", profile.displayName);

                // Get ID token for authentication
                const idToken = liff.getIDToken();
                console.log("✅ ID Token length:", idToken?.length);

                if (idToken) {
                  // Call our server-side API route for authentication
                  console.log("🔄 Calling server-side login API...");
                  fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ idToken }),
                  })
                  .then(response => {
                    if (response.ok) {
                      return response.json().then(data => {
                        console.log("✅ Server login successful:", data);

                        if (data.success && data.user) {
                          // Store user data in client storage for future use
                          const userData = {
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            picture: data.user.profilePicture,
                            role: data.user.role,
                            department: data.user.departmentName || data.user.Department?.name,
                            employeeId: data.user.employeeId,
                          };

                          // Set the auth token in storage
                          if (data.token) {
                            setAuthToken(data.token);
                          }

                          // Store the user data in storage
                          setCurrentUser(userData);
                          
                          // Mark that we've processed auto-login
                          sessionStorage.setItem('auto_login_processed', 'true');
                          setAutoLoginProcessed(true);

                          // If in LIFF browser, handle login more silently
                          if (isInLiffBrowser) {
                            console.log("Auto-login successful in LIFF browser - redirecting silently");
                            
                            // Check if we need to redirect
                            if (typeof window !== 'undefined' && 
                                !window.location.pathname.includes('/dashboard')) {
                              // Use the special redirect route to set cookies properly
                              const redirectUrl = new URL('/api/auth/liff-redirect', window.location.origin);
                              redirectUrl.searchParams.set('auth_token', data.token);
                              redirectUrl.searchParams.set('destination', '/dashboard');
                              console.log('[LiffInit] Redirecting to LIFF redirect route:', redirectUrl.toString());
                              window.location.replace(redirectUrl.toString());
                            }
                          } else {
                            // Show success toast (only in non-LIFF browser)
                            toast({
                              title: "登入成功",
                              description: `歡迎回來，${data.user.name}`,
                            });
                            
                            // If we're not on the dashboard already, redirect there
                            if (typeof window !== 'undefined' && 
                                !window.location.pathname.includes('/dashboard')) {
                              console.log("🔄 Redirecting to dashboard after auto-login...");
                              
                              // Use a small delay to allow toast to be visible (for non-LIFF browsers)
                              setTimeout(() => {
                                if (isInLiffBrowser && data.token) {
                                  // Use the special redirect route for LIFF browser
                                  const redirectUrl = new URL('/api/auth/liff-redirect', window.location.origin);
                                  redirectUrl.searchParams.set('auth_token', data.token);
                                  redirectUrl.searchParams.set('destination', '/dashboard');
                                  console.log('[LiffInit] LIFF browser redirecting to redirect route:', redirectUrl.toString());
                                  window.location.href = redirectUrl.toString();
                                } else {
                                  // Regular redirect for non-LIFF browsers
                                  window.location.href = '/dashboard';
                                }
                              }, 300);
                            }
                          }
                        }
                      });
                    } else {
                      console.error("❌ Server login failed with status:", response.status);
                      
                      // Handle error from server safely
                      let errorMessage = "驗證失敗，請重試";
                      return response.text().then(text => {
                        // Log the raw response for debugging
                        console.log("Raw API error response:", text.substring(0, 200) + (text.length > 200 ? '...' : ''));
                        
                        try {
                          const errorData = JSON.parse(text);
                          console.log("Error data:", errorData);
                        
                          // If this is a binding case, redirect to the binding page
                          if (response.status === 403 && (
                            errorData.error === "User not registered in the system" ||
                            (errorData.error && errorData.error.includes("not registered"))
                          )) {
                            console.log("Detected user needs to bind employee ID, redirecting to binding page");
                            
                            // Extract LINE user data if available
                            const lineData = errorData.lineData || {};
                            const lineParams = lineData.userId ? 
                              `?lineUserId=${encodeURIComponent(lineData.userId)}` +
                              `&userName=${encodeURIComponent(lineData.name || '')}` +
                              `&picture=${encodeURIComponent(lineData.picture || '')}`
                              : '';
                            
                            // Navigate to the binding page with LINE parameters
                            console.log("Redirecting to binding page with params...");
                            window.location.href = `/bind${lineParams}`;
                            return;
                          }
                          
                          // Otherwise show error toast
                          errorMessage = errorData.error || errorMessage;
                        } catch (parseError) {
                          console.error("JSON parse error:", parseError);
                        }
                        
                        toast({
                          title: "登入失敗",
                          description: errorMessage,
                          variant: "destructive",
                        });
                      }).catch(textError => {
                        console.error("Error reading response text:", textError);
                        toast({
                          title: "登入失敗",
                          description: errorMessage,
                          variant: "destructive",
                        });
                      });
                    }
                  })
                  .catch(apiError => {
                    console.error("❌ API call error:", apiError);
                    toast({
                      title: "登入失敗",
                      description: "伺服器連線錯誤",
                      variant: "destructive",
                    });
                  });
                } else {
                  console.error("❌ No ID token available");
                  toast({
                    title: "登入失敗",
                    description: "無法取得LINE驗證資訊，請重試",
                    variant: "destructive",
                  });
                }
              })
              .catch(profileError => {
                console.error("❌ Could not get LINE profile:", profileError);
                setError("Could not get LINE profile");
                toast({
                  title: "登入失敗",
                  description: "無法取得LINE個人資料，請重試",
                  variant: "destructive",
                });
                setIsLoading(false);
              });
          } else {
            console.log("🔴 User is NOT logged in with LINE");
            if (isRedirect) {
              console.log("⚠️ We received a redirect from LINE but user is not logged in!");

              // If we're on the callback URL but not logged in, try to handle login
              try {
                console.log("🔄 Attempting to login with LINE...");
                liff.login();
              } catch (loginError) {
                console.error("❌ Error during login attempt:", loginError);
                setIsLoading(false);
              }
            } else {
              setIsLoading(false);
            }
          }
        })
        .catch(err => {
          console.error("LIFF initialization error:", err);
          setError("LIFF initialization failed");
          toast({
            title: "LINE初始化失敗",
            description: "請重新嘗試或重新載入頁面",
            variant: "destructive",
          });
          setIsLoading(false);
        });
    }

    initializeLiff()
    
    // Cleanup function
    return () => {
      // Nothing to clean up for now
    }
  }, [router, toast])

  // This is just a silent initialization component that handles the LIFF lifecycle
  return null
}