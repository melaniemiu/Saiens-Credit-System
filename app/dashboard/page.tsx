"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditStats } from "@/components/credit-stats"
import { CreditHistory } from "@/components/credit-history"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState, Suspense } from "react"
import { userApi, setAuthToken } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { AuthError } from "@/components/auth-error"
import { GiveCreditButton } from "@/components/give-credit-button"
import { useSearchParams } from "next/navigation"

function DashboardContent() {
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(!user)
  const [userData, setUserData] = useState(user || null)
  const searchParams = useSearchParams()

  // Handle auth token from URL (for LIFF browser redirect and binding process)
  useEffect(() => {
    const authToken = searchParams?.get('auth_token')
    const liffAuth = searchParams?.get('liff_auth')
    const authBypass = searchParams?.get('auth_bypass')
    
    console.log('[Dashboard] URL params:', {
      authToken: authToken ? 'present' : 'missing',
      liffAuth: liffAuth,
      authBypass: authBypass
    });
    
    if (authToken) {
      console.log("[Dashboard] Found auth token in URL, setting up authentication")
      
      // Store the token in localStorage and sessionStorage only
      localStorage.setItem('authToken', authToken)
      sessionStorage.setItem('authToken', authToken)
      
      // Also set it in the API client
      setAuthToken(authToken)
      
      // Clean up the URL without reloading
      const url = new URL(window.location.href)
      url.searchParams.delete('auth_token')
      url.searchParams.delete('liff_auth')
      url.searchParams.delete('auth_bypass')
      window.history.replaceState({}, document.title, url.toString())
      
      console.log('[Dashboard] Auth token stored, auth should update automatically');
    } else if (authBypass) {
      console.log("[Dashboard] Auth bypass detected from binding process")
      
      // Token should already be in storage from the binding process
      const existingToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      if (existingToken) {
        console.log('[Dashboard] Using existing token from storage')
        setAuthToken(existingToken)
      }
      
      // Clean up the URL
      const url = new URL(window.location.href)
      url.searchParams.delete('auth_bypass')
      window.history.replaceState({}, document.title, url.toString())
      
      // Force a refresh of user data
      setIsLoading(true)
    }
  }, [searchParams])

  // Check if we're still on the dashboard after a couple of seconds
  // This helps debug redirect loops
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("Dashboard mounted - checking auth state")

      // Check if we're on the dashboard page
      const isDashboard = window.location.pathname.includes('/dashboard')
      if (isDashboard) {
        console.log("Dashboard page - Auth state:",
          user ? "User authenticated" : "No user",
          "Loading:", authLoading
        )
        
        // Check for direct dashboard access flag from binding
        const hasDashboardDirectFlag = 
          sessionStorage.getItem('dashboard_direct') === 'true' || 
          localStorage.getItem('dashboard_direct') === 'true';
        
        if (hasDashboardDirectFlag) {
          console.log("Dashboard direct access flag detected - cleaning up");
          
          // Clear the flag to prevent issues with future visits
          try {
            sessionStorage.removeItem('dashboard_direct');
            localStorage.removeItem('dashboard_direct');
            
            // Also ensure auto-login processed flag is set
            sessionStorage.setItem('auto_login_processed', 'true');
            
            // Remove URL parameters to clean up the URL
            if (window.location.search) {
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            }
          } catch (e) {
            console.error("Error cleaning up dashboard direct flags:", e);
          }
        }
      }
    }
  }, [])

  useEffect(() => {
    // Check if we have auth token in storage
    const hasAuthToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    console.log("Dashboard - Auth token check:", hasAuthToken ? "Found" : "Not found");

    // If we already have user data from auth context, use that
    if (user) {
      console.log("Dashboard - Using user data from auth context");
      setUserData(user);
      setIsLoading(false);
      return;
    }
    
    // Check for auth bypass - this means we just completed employee binding
    const authBypass = searchParams?.get('auth_bypass')
    if (authBypass && hasAuthToken) {
      console.log("Dashboard - Auth bypass with token found, forcing user data fetch");
      // Continue to fetch user data below
    } else {
      // Don't fetch if we just set the auth token from URL
      const authToken = searchParams?.get('auth_token')
      if (authToken) {
        return;
      }
    }

    // Otherwise fetch from API
    const fetchUserData = async () => {
      try {
        console.log("Dashboard - Fetching user data from API");
        setIsLoading(true);
        const response = await userApi.getCurrentUser();

        if (response.data?.user) {
          console.log("Dashboard - User data fetched successfully");
          const fetchedUser = {
            name: response.data.user.name,
            employeeId: response.data.user.employeeId,
            department: response.data.user.Department?.name,
            email: response.data.user.email,
            id: response.data.user.id,
            role: response.data.user.role,
          };

          setUserData(fetchedUser);

          // If we got user data from API but not from context,
          // update the auth context as well (for next time)
          if (!user) {
            console.log("Dashboard - Updating auth context with fetched user data");

            // Store the user data in localStorage/sessionStorage through the auth lib
            const authUser = {
              id: response.data.user.id,
              name: response.data.user.name,
              email: response.data.user.email,
              picture: response.data.user.profilePicture,
              role: response.data.user.role,
              department: response.data.user.Department?.name,
              employeeId: response.data.user.employeeId,
            };

            // Import dynamically to avoid circular dependencies
            const authModule = await import('@/lib/auth');
            authModule.setCurrentUser(authUser);
          }
        } else {
          console.log("Dashboard - No user data returned from API");
        }
      } catch (error) {
        console.error("Dashboard - Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, searchParams])

  // Handle manual refresh if needed
  const handleManualRefresh = () => {
    window.location.reload()
  }

  // Function to check if user should see dashboard
  const shouldShowDashboard = () => {
    // If we have valid user data, show dashboard
    if (userData && !isLoading) {
      return true
    }

    // If still loading, show dashboard with loading state
    if (isLoading && (user || authLoading)) {
      return true
    }

    // Otherwise, don't show dashboard
    return false
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {shouldShowDashboard() ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">員工儀表板</h1>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleManualRefresh}
            >
              <RefreshCw className="h-4 w-4" />
              重新載入
            </Button>
          </div>
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <Card className="flex-1 border-none shadow-lg bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10 pb-3">
                <CardTitle className="text-base font-semibold text-gray-800">個人資料</CardTitle>
                <CardDescription className="text-xs text-gray-600">您的基本資訊</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ) : userData ? (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 transition-colors duration-200">
                      <span className="text-xs font-medium text-gray-600">姓名</span>
                      <span className="text-sm font-medium text-gray-900">{userData.name || "于小明"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 transition-colors duration-200">
                      <span className="text-xs font-medium text-gray-600">工號</span>
                      <span className="text-sm font-medium text-gray-900">{userData.employeeId || "EMP001"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 transition-colors duration-200">
                      <span className="text-xs font-medium text-gray-600">部門</span>
                      <span className="text-sm font-medium text-gray-900">{userData.department || "工程部"}</span>
                    </div>
                    {(userData.email || true) && (
                      <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 transition-colors duration-200">
                        <span className="text-xs font-medium text-gray-600">Email</span>
                        <span className="text-sm truncate max-w-[140px] sm:max-w-[180px] font-medium text-gray-900">{userData.email || "xiaoming.wang@example.com"}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-500">無法載入數據</div>
                )}
              </CardContent>
            </Card>

            <CreditStats />
          </div>

          <CreditHistory />
          <GiveCreditButton />
        </>
      ) : (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AuthError />
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}