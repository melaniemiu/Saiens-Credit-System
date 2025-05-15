"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthUser, getLineUserProfile, isAuthenticated, getCurrentUser, setCurrentUser, logout as authLogout } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { authApi, userApi, setAuthToken, removeAuthToken } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import liff from '@line/liff'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: () => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Helper function to check if on a binding page
  const isOnBindingPage = () => {
    if (typeof window === 'undefined') return false;
    
    // Check URL path
    const isBindPath = window.location.pathname === '/bind' || 
                      window.location.pathname === '/bind-employee';
                      
    // Check for binding page flag
    const hasBindFlag = sessionStorage.getItem('on_binding_page') === 'true';
    
    return isBindPath || hasBindFlag;
  };

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        // Skip auth initialization on binding pages
        if (isOnBindingPage()) {
          console.log("On binding page, skipping auth context initialization");
          setLoading(false);
          return;
        }
        
        setLoading(true)

        // Check if user is already authenticated
        if (isAuthenticated()) {
          // First try to get stored user
          const storedUser = getCurrentUser()

          if (storedUser) {
            setUser(storedUser)

            // Validate with backend
            const response = await userApi.getCurrentUser()
            if (response.data?.user) {
              const backendUser: AuthUser = {
                id: response.data.user.id,
                name: response.data.user.name,
                email: response.data.user.email,
                picture: response.data.user.profilePicture,
                role: response.data.user.role,
                department: response.data.user.Department?.name,
                employeeId: response.data.user.employeeId,
                creditsReceived: response.data.user.creditsReceived,
                creditsGiven: response.data.user.creditsGiven,
                remainingDailyCredits: response.data.user.remainingDailyCredits,
              }

              setCurrentUser(backendUser)
              setUser(backendUser)
            }
          } else {
            // Try to get LINE profile
            const lineProfile = await getLineUserProfile()

            if (lineProfile) {
              // We got LINE profile, but no backend validation yet
              // Check if auto-login has been processed before trying to login
              const autoLoginProcessed = sessionStorage.getItem('auto_login_processed') === 'true';
              
              if (!autoLoginProcessed) {
                console.log("LINE profile available but no user data. LiffInit should handle auto-login.");
                // Let LiffInit handle the auto-login flow
                setUser(null)
              } else {
                console.log("LINE profile available but auto-login already processed. Not triggering login again.");
              }
            }
          }
        } else {
          // Not authenticated - check if we're in the LIFF browser
          try {
            // Check for LIFF browser and auto-login flag
            const liffModule = await import('@line/liff');
            const liff = liffModule.default;
            
            // Only proceed if LIFF is available and we're not on the binding page
            if (typeof liff !== 'undefined' && liff.isInClient() && !isOnBindingPage()) {
              const autoLoginProcessed = sessionStorage.getItem('auto_login_processed') === 'true';
              
              if (!autoLoginProcessed) {
                console.log("🔄 In LIFF browser but not authenticated. LiffInit should handle auto-login.");
                // Let LiffInit handle the auto-login
              }
            }
          } catch (e) {
            console.error("Error checking LIFF environment:", e);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError('Failed to initialize authentication')
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const refreshUser = async () => {
    try {
      setLoading(true)

      // Add a flag to the request to bypass cache
      const response = await userApi.getCurrentUser(true)

      if (response.data?.user) {
        const backendUser: AuthUser = {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          picture: response.data.user.profilePicture,
          role: response.data.user.role,
          department: response.data.user.Department?.name,
          employeeId: response.data.user.employeeId,
          creditsReceived: response.data.user.creditsReceived,
          creditsGiven: response.data.user.creditsGiven,
          remainingDailyCredits: response.data.user.remainingDailyCredits,
        }

        // Set React state without saving to storage to prevent recursive loop
        setUser(backendUser)

        // Only save to storage if user data doesn't exist or has changed
        const currentUserData = getCurrentUser();
        if (!currentUserData || JSON.stringify(currentUserData) !== JSON.stringify(backendUser)) {
          setCurrentUser(backendUser)
        }
      }
    } catch (err) {
      console.error('User refresh error:', err)
    } finally {
      setLoading(false)
    }
  }

  const login = async () => {
    try {
      // Skip login on binding pages
      if (isOnBindingPage()) {
        console.log("On binding page, skipping login process");
        return;
      }
      
      // Check if auto-login was already processed
      const autoLoginProcessed = sessionStorage.getItem('auto_login_processed') === 'true';
      const isAlreadyAuthenticated = isAuthenticated();
      
      // If already authenticated via auto-login, just redirect to dashboard
      if (autoLoginProcessed && isAlreadyAuthenticated) {
        console.log("User already authenticated via auto-login, redirecting to dashboard");
        window.location.href = '/dashboard';
        return;
      }
      
      setLoading(true)
      setError(null)

      // Import liff dynamically
      const liffModule = await import('@line/liff')
      const liff = liffModule.default

      // Check if user is logged in with LIFF
      if (!liff.isLoggedIn()) {
        console.log("User not logged in with LINE, redirecting to login...")
        liff.login()
        return // Stop here and let the redirect happen
      }

      console.log("User is logged in with LINE, getting profile...")

      // Get profile and token
      let lineProfile
      let idToken

      try {
        lineProfile = await liff.getProfile()
        idToken = liff.getIDToken()

        console.log("Got idToken length:", idToken?.length || 0)

        if (!lineProfile || !idToken) {
          console.error("Missing profile or token")
          throw new Error("Missing profile or token")
        }
      } catch (error) {
        console.error("Error getting LINE profile/token:", error)
        toast({
          title: "LIFF資料錯誤",
          description: "無法取得LINE資料，請重新登入",
          variant: "destructive",
        })

        // Force logout and re-login
        liff.logout()
        setTimeout(() => liff.login(), 500)
        setLoading(false)
        return
      }

      console.log("Successfully retrieved LINE profile")

      // Send to our backend
      const response = await authApi.lineLogin(idToken)

      if (response.error || !response.data) {
        // Check if this is a binding case first, before showing any error message
        const isBindingCase = 
          response.status === 403 || 
          (response.error && (
            response.error === "User not registered in the system" || 
            response.error.includes("not registered") ||
            response.error.includes("User not registered")
          ));
        
        // Only log as error if it's not a binding case
        if (!isBindingCase) {
          console.error("Backend auth error:", response.error);
        } else {
          console.log("Backend response (binding case):", response.error);
        }

        // Special handling for user not registered in system (needs employee ID binding)
        console.log("Checking for binding case:", response.error, response.status)
        
        if (isBindingCase) {
          
          console.log("✅ User needs to bind employee ID - redirecting to binding page")
          // Only show this toast once the user is on the binding page to avoid confusion
          // The message will be shown on the binding page itself
          
          // Import debug and clear functions
          const { clearAuthStorage, debugAuthStorage } = await import('@/lib/auth')
          
          // Debug current storage state
          console.log("Before handling binding case:")
          debugAuthStorage()
          
          // Clean all auth storage to ensure a fresh start
          // This is important to prevent cached users causing issues
          clearAuthStorage()
          
          // Get LINE user data from the response
          const lineData = response.lineData || {}
          const lineParams = lineData.userId ? 
            `?lineUserId=${encodeURIComponent(lineData.userId)}` +
            `&userName=${encodeURIComponent(lineData.name || '')}` +
            `&picture=${encodeURIComponent(lineData.picture || '')}`
            : ''
          
          // Force clean any existing LIFF login session first
          try {
            liff.logout()
            console.log("Logged out of LINE before redirecting to binding page")
          } catch (e) {
            console.error("Error logging out of LINE:", e)
          }
          
          // Set a flag to prevent auto-login on binding page
          try {
            sessionStorage.setItem('on_binding_page', 'true');
            sessionStorage.setItem('auth_redirect', 'bind-employee');
            console.log("Set binding page flags in sessionStorage");
          } catch (e) {
            console.error("Failed to set sessionStorage flags:", e);
          }
          
          // Redirect to dedicated binding page
          console.log("Redirecting to dedicated binding page at /bind");
          window.location.href = `/bind${lineParams}`;
          
          setLoading(false);
          return;
        }

        // Special handling for token expiration
        if (response.error === "token_expired" ||
            response.status === 401 ||
            response.error?.includes("expired")) {

          toast({
            title: "登入已過期",
            description: "請重新登入LINE",
            variant: "destructive",
          })

          // Force logout and re-login after a short delay
          try {
            liff.logout();
            setTimeout(() => {
              toast({
                title: "重新導向登入頁",
                description: "即將重新登入",
              });
              setTimeout(() => liff.login(), 1000);
            }, 1000);
          } catch (e) {
            console.error("Error during logout/login process:", e);
          }

          setLoading(false);
          return;
        }

        // Check if it's a binding case one more time (the previous check might have been modified)
        const maybeBindingCase = 
          response.status === 403 || 
          (response.error && (
            response.error === "User not registered in the system" || 
            response.error.includes("not registered") ||
            response.error.includes("User not registered")
          ));
          
        if (!maybeBindingCase) {
          // Only show toast for non-binding errors
          toast({
            title: "登入失敗",
            description: response.error || "無法驗證您的身份",
            variant: "destructive",
          })
          throw new Error(response.error || 'Authentication failed')
        } else {
          // For binding case, don't show error toast and don't throw
          console.log("Skipping error toast for binding case")
        }
      }

      // Check if user has an employee ID
      if (!response.data.user.employeeId) {
        console.log("User doesn't have employee ID, redirecting to binding page")
        // Redirect to employee ID binding page
        router.push('/bind-employee')
        setLoading(false)
        return
      }

      // Save the JWT token
      setAuthToken(response.data.token)

      // Create user object
      const backendUser: AuthUser = {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        picture: response.data.user.profilePicture,
        role: response.data.user.role,
        department: response.data.user.departmentName,
        employeeId: response.data.user.employeeId,
        creditsReceived: response.data.user.creditsReceived,
        creditsGiven: response.data.user.creditsGiven,
        remainingDailyCredits: response.data.user.remainingDailyCredits,
      }

      // Update user state
      setCurrentUser(backendUser)
      setUser(backendUser)
      
      // Mark that we've processed login
      sessionStorage.setItem('auto_login_processed', 'true');

      // Show success toast
      toast({
        title: "登入成功",
        description: `歡迎回來，${response.data.user.name}`,
      })

      // Redirect to dashboard with multiple methods to ensure it works
      console.log("🔄 Auth context redirecting to dashboard...")
      try {
        // First try Next.js router
        router.push('/dashboard')

        // Also use direct navigation as fallback after a short delay
        setTimeout(() => {
          console.log("🔄 Auth context using window.location as fallback...")
          window.location.href = '/dashboard'
        }, 1000)
      } catch (redirectError) {
        console.error("❌ Redirection error in auth context:", redirectError)
        // Fallback to basic navigation
        window.location.href = '/dashboard'
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to log in')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Show loading state
      setLoading(true)

      // Check if we're in LIFF browser environment
      const liffModule = await import('@line/liff')
      const liff = liffModule.default
      const isInLiffBrowser = liff.isInClient && liff.isInClient()

      // First, clear the React state
      setUser(null)

      if (isInLiffBrowser) {
        // In LIFF browser, we can't actually log out of LINE
        // We just clear the app state and reload
        toast({
          title: "清除資料中...",
          description: "將重新載入應用程式",
        })

        // Call our API directly to clear cookies
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
          })
        } catch (e) {
          console.error("Error calling logout API:", e)
        }

        // Clear all local storage and tokens
        removeAuthToken()
        authLogout()
        
        // Clear auto-login flag to force a fresh start
        try {
          sessionStorage.removeItem('auto_login_processed')
          localStorage.removeItem('auto_login_processed')
        } catch (e) {
          console.error("Error clearing storage flags:", e)
        }
        
        // For LIFF browser, reload the app instead of redirecting to login
        toast({
          title: "已清除資料",
          description: "重新整理應用程式",
        })

        // Reload with a timestamp to prevent caching
        setTimeout(() => {
          window.location.replace(`/?reload=${Date.now()}`)
        }, 1000)
      } else {
        // For regular browsers, proceed with normal logout
        // Show toast notification
        toast({
          title: "登出中...",
          description: "請稍候",
        })

        // Create a form to post to logout
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = '/api/auth/logout?redirect=true'
        document.body.appendChild(form)

        // Submit the form - this will call our API and handle the redirect
        // all in one server-side operation (avoiding the auth error flash)
        form.submit()

        // This is a fallback in case the form submission fails
        setTimeout(() => {
          // Manual cleanup and redirect
          removeAuthToken()
          authLogout()
          window.location.href = '/'
        }, 2000)
      }
    } catch (error) {
      console.error('Logout error:', error)

      // Still try to clean up client state
      removeAuthToken()
      setUser(null)

      // Force redirect to login page
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}