"use client"

import React, { useEffect, useState, useRef } from "react"
import { LineLoginButton } from "@/components/line-login-button"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRedirect, setIsRedirect] = useState(false)
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false)

  // State to track auto-login
  const [autoLoginInProgress, setAutoLoginInProgress] = useState(false);
  const [autoLoginMessage, setAutoLoginMessage] = useState<string | null>(null);
  
  // Declare all state variables outside conditional blocks
  const [isInLiffBrowser, setIsInLiffBrowser] = useState(false);
  const [isReload, setIsReload] = useState(false);
  
  // Compute values outside conditional rendering
  const isLogout = searchParams?.has('logout');
  
  // Determine the message to show - moved outside conditional rendering
  let message = "登入處理中，請稍候...";
  
  if (isLogout) {
    message = isInLiffBrowser ? "清除資料中..." : "已登出系統，請重新登入";
  } else if (isReload) {
    message = "重新載入中...";
  } else if (autoLoginMessage) {
    message = autoLoginMessage;
  }
  
  // Initialize isRedirect based on URL on first render
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    console.log("Home page - Auth state:", user ? "User authenticated" : "No user");
    
    // If we're already in a redirect state, don't do anything
    if (isRedirect) return;
    
    // Function to check for auth redirection flag
    const checkRedirectFlag = () => {
      try {
        const redirectFlag = sessionStorage.getItem('auth_redirect');
        if (redirectFlag) {
          console.log(`Home page - Auth redirect flag found: ${redirectFlag}`);
          
          // Clear the redirect flag
          sessionStorage.removeItem('auth_redirect');
          
          // If the flag is 'bind-employee' and we're not already there, redirect
          if (redirectFlag === 'bind-employee' && window.location.pathname !== '/bind-employee') {
            console.log("Home page - Redirecting to bind-employee page based on flag");
            window.location.href = '/bind-employee';
            return true;
          }
        }
      } catch (e) {
        console.error("Error checking redirect flag:", e);
      }
      return false;
    };
    
    // Check for auth redirect flag first
    if (checkRedirectFlag()) {
      return;
    }
    
    // Function to redirect to dashboard directly
    const goToDashboard = () => {
      console.log("Home page - Redirecting authenticated user to dashboard");
      // Use replace instead of href to make a cleaner transition
      window.location.replace("/dashboard");
    };
    
    // If user is already authenticated, redirect to dashboard
    if (user) {
      goToDashboard();
      return;
    }
    
    // Check if auto-login should be in progress (in LIFF browser)
    try {
      // Import LINE LIFF
      import('@line/liff').then(async liffModule => {
        const liff = liffModule.default;
        
        // If LIFF is in client (LINE browser)
        if (liff.isInClient()) {
          // Check if we already have authenticated status in some form
          try {
            const hasAuth = !!localStorage.getItem('authToken') || !!sessionStorage.getItem('authToken');
            const hasUserData = !!localStorage.getItem('user') || !!sessionStorage.getItem('user');
            
            // If we have authentication data, redirect to dashboard immediately
            if (hasAuth && hasUserData) {
              console.log("Found existing auth data in LIFF browser, redirecting to dashboard");
              goToDashboard();
              return;
            }
          } catch (e) {
            console.error("Error checking storage:", e);
          }
          
          // No existing auth - show auto-login message with quick timeout
          if (!autoLoginInProgress) {
            console.log("In LIFF browser - starting silent auto-login");
            setAutoLoginInProgress(true);
            
            // Check if auto-login is happening in 1 second
            setTimeout(() => {
              // If we're still on the home page after 1 second
              if (typeof window !== 'undefined' && window.location.pathname === '/') {
                console.log("Still on home page after 1s, showing login message");
                setAutoLoginMessage("LINE 帳號登入中...");
                
                // Check progress again after another 2 seconds
                setTimeout(() => {
                  if (typeof window !== 'undefined' && window.location.pathname === '/') {
                    const processed = sessionStorage.getItem('auto_login_processed') === 'true';
                    const authenticated = !!sessionStorage.getItem('authToken');
                    
                    if (!processed || !authenticated) {
                      // Auto-login is taking longer than expected
                      console.log("Auto-login is taking longer than expected");
                      setAutoLoginMessage("LINE 帳號驗證中，請稍候...");
                      
                      // Check again after another 4 seconds
                      setTimeout(() => {
                        if (typeof window !== 'undefined' && window.location.pathname === '/') {
                          // If still not processed, show manual login button
                          console.log("Auto-login timeout, showing manual login option");
                          setAutoLoginMessage("請點擊下方按鈕登入");
                          setAutoLoginInProgress(false);
                        }
                      }, 4000);
                    }
                  }
                }, 2000);
              }
            }, 1000);
          }
        }
      }).catch(err => {
        console.error("Error importing LIFF:", err);
      });
    } catch (e) {
      console.error("Error checking LIFF client:", e);
    }
    
    // Check if this is a LINE redirect by looking for code parameter
    try {
      if (typeof window !== 'undefined') {
        // Check if we've already processed this code
        const processedCode = sessionStorage.getItem('processed_code');
        
        // Use the Next.js searchParams hook instead of window.location
        const currentCode = searchParams?.get('code');
        
        // Only handle code param if it exists and we haven't processed it yet
        if (currentCode && (!processedCode || processedCode !== currentCode)) {
          console.log("Home page - New LINE redirect code detected");
          
          // Mark this code as processed
          sessionStorage.setItem('processed_code', currentCode);
          
          // Show redirect loading state
          setIsRedirect(true);
          
          // Set timeout to show error message if redirect takes too long
          setTimeout(() => {
            // Check for redirect flag again before showing error
            if (!checkRedirectFlag()) {
              console.log("Home page - Loading timeout reached");
              setIsRedirect(false);
              setShowTimeoutMessage(true);
            }
          }, 10000);
        }
      }
    } catch (error) {
      console.error("Error checking URL params:", error);
    }
  }, [user, isRedirect, searchParams, autoLoginInProgress]);
  
  // Unified useEffect for LIFF browser detection and auto-login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasReloadParam = searchParams?.has('reload');
      
      if (hasReloadParam) {
        setIsReload(true);
      }
      
      // Simplified LIFF import - don't try to initialize here
      import('@line/liff').then(async liffModule => {
        const liff = liffModule.default;
        
        try {
          // Just check if we're in LIFF browser, don't initialize
          if (liff.isInClient && liff.isInClient()) {
            console.log("Detected LIFF browser");
            setIsInLiffBrowser(true);
          }
        } catch (e) {
          // If LIFF is not initialized, this will fail, but that's ok
          console.log("LIFF not initialized in Home page, login button will handle it");
        }
        
        try {
          // Now check if we're in LIFF browser (only if not already set)
          if (!isInLiffBrowser) {
            const isInLiffClient = liff.isInClient && liff.isInClient();
            console.log("Detected LIFF browser:", isInLiffClient);
            setIsInLiffBrowser(isInLiffClient);
            
            if (isInLiffClient) {
              // If we're in LIFF browser and it's a reload/logout
              if (isLogout || hasReloadParam) {
                console.log("Handling reload/logout in LIFF browser");
                
                // Clear auto-login flags to get a fresh start
                try {
                  sessionStorage.removeItem('auto_login_processed');
                  localStorage.removeItem('auto_login_processed');
                  
                  // After a short delay, reload without the parameters
                  setTimeout(() => {
                    // Redirect to clean URL only if we still have parameters
                    if (window.location.search) {
                      const cleanUrl = window.location.pathname;
                      window.location.replace(cleanUrl);
                    }
                  }, 1500);
                } catch (e) {
                  console.error("Error cleaning up state:", e);
                }
              } else {
                // We're in LIFF browser but not handling logout/reload
                // This is crucial for auto-login in LIFF browser
                console.log("In LIFF browser on normal page load");
                
                // Check if auto-login is already processed
                const autoLoginProcessed = sessionStorage.getItem('auto_login_processed') === 'true';
                const hasAuth = !!localStorage.getItem('authToken') || !!sessionStorage.getItem('authToken');
                
                if (!autoLoginProcessed && !hasAuth) {
                  console.log("Auto-login not processed yet, checking LIFF login state");
                  
                  // Check if logged in with LIFF
                  if (liff.isLoggedIn()) {
                    console.log("User is logged in with LIFF, getting profile");
                    
                    try {
                      // Get user profile
                      const profile = await liff.getProfile();
                      console.log("Got LINE profile for auto-login:", profile.displayName);
                      const idToken = liff.getIDToken();
                      
                      if (idToken) {
                        // Call our server API directly
                        const response = await fetch('/api/auth/login', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ idToken }),
                        });
                        
                        const data = await response.json();
                        
                        if (data.success && data.user) {
                          // Store user data in client storage
                          const userData = {
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            picture: data.user.profilePicture,
                            role: data.user.role,
                            department: data.user.departmentName || data.user.Department?.name,
                            employeeId: data.user.employeeId,
                          };
                          
                          // Set auth data
                          if (data.token) {
                            localStorage.setItem("authToken", data.token);
                            sessionStorage.setItem("authToken", data.token);
                            document.cookie = `user_session=${data.token}; path=/; max-age=${60 * 60 * 24}`;
                          }
                          
                          // Store user data
                          localStorage.setItem("user", JSON.stringify(userData));
                          sessionStorage.setItem("user", JSON.stringify(userData));
                          
                          // Set auth flags
                          sessionStorage.setItem('authenticated', 'true');
                          localStorage.setItem('authenticated', 'true');
                          sessionStorage.setItem('auto_login_processed', 'true');
                          
                          // Redirect to dashboard
                          console.log("Auto-login successful, redirecting to dashboard");
                          window.location.replace('/dashboard');
                        } else if (!autoLoginInProgress) {
                          // If we're not already showing the auto-login state, update it
                          setAutoLoginInProgress(false);
                          setAutoLoginMessage("等待自動登入中...");
                        }
                      }
                    } catch (error) {
                      console.error("Could not get LINE profile:", error);
                      setAutoLoginInProgress(false);
                      setAutoLoginMessage("等待自動登入中...");
                    }
                  } else {
                    console.log("User not logged in with LIFF");
                    setAutoLoginInProgress(false);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Error checking LIFF client:", e);
          setAutoLoginInProgress(false);
        }
      }).catch(err => {
        console.error("Error accessing LIFF:", err);
        setAutoLoginInProgress(false);
      });
    }
  }, [isLogout, searchParams, isRedirect, loading, autoLoginInProgress]);

  // Import the auto-redirect component
  const LineAutoRedirect = dynamic(() => import('@/components/line-auto-redirect').then(mod => mod.LineAutoRedirect), {
    ssr: false,
    loading: () => <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
  });

  // Render loading state or login form based on condition
  if (isRedirect || loading || autoLoginInProgress) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          <p className="text-xl font-medium text-gray-700">
            {message}
          </p>
          
          {showTimeoutMessage && (
            <div className="mt-4 text-center">
              <p className="text-red-600 mb-2">登入處理時間過長</p>
              
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    // Clear any flags before reloading
                    sessionStorage.removeItem('auto_login_processed');
                    sessionStorage.removeItem('processed_code');
                    window.location.reload();
                  }
                }} 
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                重新載入
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // For LINE LIFF browser, just show the auto-redirect component
  if (isInLiffBrowser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-600">山恩實業</h1>
            <h2 className="text-2xl font-bold text-green-600 mt-2">員工互動表彰系統</h2>
            <p className="mt-2 text-gray-600">自動登入中，請稍候...</p>
          </div>
          
          <div className="mt-8">
            <LineAutoRedirect />
          </div>
        </div>
      </div>
    );
  }

  // Default login page for non-LIFF browser
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600">山恩實業</h1>
          <h2 className="text-2xl font-bold text-green-600 mt-2">員工互動表彰系統</h2>
          <p className="mt-2 text-gray-600">使用 LINE 帳號登入以開始使用</p>
        </div>

        <div className="mt-8 flex justify-center">
          <LineLoginButton />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>登入後即可查看您的 credit 並向同事表達感謝</p>
        </div>
      </div>
    </div>
  );
}