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

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
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
              }

              setCurrentUser(backendUser)
              setUser(backendUser)
            }
          } else {
            // Try to get LINE profile
            const lineProfile = await getLineUserProfile()

            if (lineProfile) {
              // We got LINE profile, but no backend validation yet
              // We'll let the login button handle the full login flow
              setUser(null)
            }
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
        console.error("Backend auth error:", response.error);

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

        // Other errors
        toast({
          title: "登入失敗",
          description: response.error || "無法驗證您的身份",
          variant: "destructive",
        })
        throw new Error(response.error || 'Authentication failed')
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
      }

      // Update user state
      setCurrentUser(backendUser)
      setUser(backendUser)

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
    // Clear auth token
    removeAuthToken()

    // Use the logout function from auth.ts - note it's async now
    await authLogout()
    setUser(null)

    // Redirect to home page
    router.push('/')
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