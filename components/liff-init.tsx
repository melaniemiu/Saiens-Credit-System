"use client"

import { useEffect, useState } from 'react'
import liff from '@line/liff'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { setCurrentUser } from '@/lib/auth'
import { setAuthToken } from '@/lib/api'

// Replace with your actual LIFF ID
const LIFF_ID = "2007394904-dYXDv6o9"

export function LiffInit() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check for binding page flag or path
    const onBindingPage = (typeof window !== 'undefined' && 
      (window.location.pathname === '/bind' || 
       window.location.pathname === '/bind-employee' || 
       sessionStorage.getItem('on_binding_page') === 'true'));
    
    if (onBindingPage) {
      console.log("On binding page or binding flag set, skipping LIFF initialization");
      setIsLoading(false);
      return;
    }
    
    // Check if we're on the redirect URL with a code parameter
    const url = new URL(window.location.href)
    const hasAuthCode = url.searchParams.has('code')
    const hasState = url.searchParams.has('state')
    const isRedirect = hasAuthCode && hasState

    if (isRedirect) {
      console.log("Detected LINE login redirect, initializing LIFF...")
    }

    const initializeLiff = async () => {
      try {
        console.log("🔵 Initializing LIFF with ID:", LIFF_ID)
        await liff.init({ liffId: LIFF_ID })
        console.log("✅ LIFF initialized successfully")
        setIsInitialized(true)

        // Check login state after init
        if (liff.isLoggedIn()) {
          console.log("🟢 User is logged in with LINE")

          // Try to get profile to verify login worked
          try {
            const profile = await liff.getProfile()
            console.log("✅ LINE Profile:", profile)
            console.log("✅ LINE User ID:", profile.userId)
            console.log("✅ LINE Display Name:", profile.displayName)

            // Get ID token for authentication
            try {
              const idToken = liff.getIDToken()
              console.log("✅ ID Token length:", idToken?.length)

              if (idToken) {
                // Call our server-side API route for authentication
                console.log("🔄 Calling server-side login API...")
                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ idToken }),
                });

                if (response.ok) {
                  const data = await response.json();
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

                    // Show success toast
                    toast({
                      title: "登入成功",
                      description: `歡迎回來，${data.user.name}`,
                    });

                    // Clear URL parameters if we're on the callback URL
                    if (isRedirect) {
                      console.log("🔄 Processing redirect, cleaning URL...");
                      window.history.replaceState({}, document.title, '/');

                      // Redirect to dashboard
                      console.log("🔄 Redirecting to dashboard...");
                      window.location.href = '/dashboard';
                    }
                  }
                } else {
                  console.error("❌ Server login failed with status:", response.status);
                  
                  // Handle error from server safely
                  let errorMessage = "驗證失敗，請重試";
                  try {
                    // Get text response first
                    const text = await response.text();
                    // Log the raw response for debugging
                    console.log("Raw API error response:", text.substring(0, 200) + (text.length > 200 ? '...' : ''));
                    
                    let errorData;
                    try {
                      errorData = JSON.parse(text);
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
                  } catch (textError) {
                    console.error("Error reading response text:", textError);
                  }
                  
                  toast({
                    title: "登入失敗",
                    description: errorMessage,
                    variant: "destructive",
                  });
                }
              }
            } catch (tokenError) {
              console.error("❌ Error getting ID token:", tokenError)
              toast({
                title: "登入失敗",
                description: "無法取得LINE驗證資訊，請重試",
                variant: "destructive",
              });
            }
          } catch (profileError) {
            console.error("❌ Could not get LINE profile:", profileError)
            setError("Could not get LINE profile")
            toast({
              title: "登入失敗",
              description: "無法取得LINE個人資料，請重試",
              variant: "destructive",
            });
          }
        } else {
          console.log("🔴 User is NOT logged in with LINE")
          if (isRedirect) {
            console.log("⚠️ We received a redirect from LINE but user is not logged in!")

            // If we're on the callback URL but not logged in, try to handle login
            try {
              console.log("🔄 Attempting to login with LINE...")
              liff.login()
            } catch (loginError) {
              console.error("❌ Error during login attempt:", loginError)
            }
          }
        }
      } catch (err) {
        console.error("LIFF initialization error:", err)
        setError("LIFF initialization failed")
        toast({
          title: "LINE初始化失敗",
          description: "請重新嘗試或重新載入頁面",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeLiff()
  }, [router, toast])

  // This is just a silent initialization component that handles the LIFF lifecycle
  return null
}