"use client"

import { SoftCard, SoftCardHeader, SoftCardContent, SoftCardIcon, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card"
import { CreditHistory } from "@/components/credit-history"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState, Suspense } from "react"
import { userApi, setAuthToken } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2, User, CreditCard, TrendingUp, Wallet } from "lucide-react"
import { AuthError } from "@/components/auth-error"
import { GiveCreditButton } from "@/components/give-credit-button"
import { useSearchParams } from "next/navigation"

function DashboardContent() {
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(!user)
  const [userData, setUserData] = useState(user ? {
    ...user,
    profilePicture: user.picture // Map picture to profilePicture
  } : null)
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
      setUserData({
        ...user,
        profilePicture: user.picture // Map picture to profilePicture
      });
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
            profilePicture: response.data.user.profilePicture,
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
              creditsReceived: response.data.user.creditsReceived,
              creditsSent: response.data.user.creditsSent,
              remainingDailyCredits: response.data.user.remainingDailyCredits,
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
    <div className="w-full px-6 py-6 mx-auto">
      {shouldShowDashboard() ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-700">員工儀表板</h1>
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

          {/* Row 1 - Stats Cards */}
          <div className="flex flex-wrap -mx-3">
            {/* Personal Info Card */}
            <div className="w-full max-w-full px-3 mb-6 sm:w-1/2 sm:flex-none xl:mb-0 xl:w-1/3">
              <SoftCard>
                <SoftCardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <SoftCardDescription>個人資料</SoftCardDescription>
                      <SoftCardTitle className="text-xl">
                        {isLoading ? (
                          <Skeleton className="h-6 w-24" />
                        ) : (
                          userData?.name || "于小明"
                        )}
                      </SoftCardTitle>
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-16 w-16 rounded-full" />
                    ) : (
                      <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                        <AvatarImage src={userData?.profilePicture || ''} alt={userData?.name || ''} />
                        <AvatarFallback className="bg-gradient-fuchsia text-white">
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </SoftCardHeader>
                <SoftCardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : userData ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-size-sm">
                        <span className="text-slate-400">工號</span>
                        <span className="font-semibold text-slate-700">{userData.employeeId || "EMP001"}</span>
                      </div>
                      <div className="flex justify-between items-center text-size-sm">
                        <span className="text-slate-400">部門</span>
                        <span className="font-semibold text-slate-700">{userData.department || "工程部"}</span>
                      </div>
                      {userData.email && (
                        <div className="flex justify-between items-center text-size-sm">
                          <span className="text-slate-400">Email</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[140px]">{userData.email}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-gray-500">無法載入數據</div>
                  )}
                </SoftCardContent>
              </SoftCard>
            </div>

            {/* Credits Received Card */}
            <div className="w-full max-w-full px-3 mb-6 sm:w-1/2 sm:flex-none xl:mb-0 xl:w-1/3">
              <SoftCard>
                <SoftCardHeader>
                  <div className="flex flex-row -mx-3">
                    <div className="flex-none w-2/3 max-w-full px-3">
                      <div>
                        <SoftCardDescription>收到的 Credits</SoftCardDescription>
                        <SoftCardTitle className="text-2xl">
                          {isLoading ? (
                            <Skeleton className="h-8 w-20" />
                          ) : (
                            <>
                              {user?.creditsReceived || 0}
                              <span className="leading-normal text-size-sm font-weight-bolder text-lime-500 ml-2">
                                +{user?.creditsReceived || 0}%
                              </span>
                            </>
                          )}
                        </SoftCardTitle>
                      </div>
                    </div>
                    <div className="px-3 text-right basis-1/3">
                      <SoftCardIcon gradient="bg-gradient-lime">
                        <TrendingUp className="h-6 w-6" />
                      </SoftCardIcon>
                    </div>
                  </div>
                </SoftCardHeader>
              </SoftCard>
            </div>

            {/* Credits Sent Card */}
            <div className="w-full max-w-full px-3 sm:w-1/2 sm:flex-none xl:w-1/3">
              <SoftCard>
                <SoftCardHeader>
                  <div className="flex flex-row -mx-3">
                    <div className="flex-none w-2/3 max-w-full px-3">
                      <div>
                        <SoftCardDescription>給出的 Credits</SoftCardDescription>
                        <SoftCardTitle className="text-2xl">
                          {isLoading ? (
                            <Skeleton className="h-8 w-20" />
                          ) : (
                            <>
                              {user?.creditsSent || 0}
                              <span className="leading-normal text-size-sm font-weight-bolder text-cyan-500 ml-2">
                                +{user?.creditsSent || 0}%
                              </span>
                            </>
                          )}
                        </SoftCardTitle>
                      </div>
                    </div>
                    <div className="px-3 text-right basis-1/3">
                      <SoftCardIcon gradient="bg-gradient-cyan">
                        <CreditCard className="h-6 w-6" />
                      </SoftCardIcon>
                    </div>
                  </div>
                </SoftCardHeader>
              </SoftCard>
            </div>
          </div>

          {/* Row 2 - Daily Credits Card */}
          <div className="flex flex-wrap mt-6 -mx-3">
            <div className="w-full max-w-full px-3 mb-6 lg:mb-0 lg:w-1/3 lg:flex-none">
              <SoftCard>
                <SoftCardHeader>
                  <div className="flex flex-row -mx-3">
                    <div className="flex-none w-2/3 max-w-full px-3">
                      <div>
                        <SoftCardDescription>今日剩餘 Credits</SoftCardDescription>
                        <SoftCardTitle className="text-2xl">
                          {isLoading ? (
                            <Skeleton className="h-8 w-20" />
                          ) : (
                            <>
                              {user?.remainingDailyCredits || 0}
                              <span className="leading-normal text-size-sm text-slate-400 ml-2">
                                / 5
                              </span>
                            </>
                          )}
                        </SoftCardTitle>
                      </div>
                    </div>
                    <div className="px-3 text-right basis-1/3">
                      <SoftCardIcon gradient="bg-gradient-fuchsia">
                        <Wallet className="h-6 w-6" />
                      </SoftCardIcon>
                    </div>
                  </div>
                </SoftCardHeader>
                <SoftCardContent>
                  <div className="w-full">
                    <div className="text-size-xs h-0.75 w-full m-0 flex overflow-visible rounded-lg bg-gray-200">
                      <div 
                        className="duration-600 ease-soft bg-gradient-fuchsia -mt-0.38 -ml-px flex h-1.5 flex-col justify-center overflow-hidden whitespace-nowrap rounded bg-fuchsia-500 text-center text-white transition-all" 
                        role="progressbar" 
                        aria-valuenow={(user?.remainingDailyCredits || 0) * 20} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                        style={{ width: `${(user?.remainingDailyCredits || 0) * 20}%` }}
                      />
                    </div>
                  </div>
                </SoftCardContent>
              </SoftCard>
            </div>

            {/* Recent Activity Card */}
            <div className="w-full max-w-full px-3 lg:w-2/3 lg:flex-none">
              <SoftCard>
                <SoftCardHeader>
                  <SoftCardTitle>最近的 Credit 活動</SoftCardTitle>
                  <SoftCardDescription>查看您最近收到和給出的 Credits</SoftCardDescription>
                </SoftCardHeader>
                <SoftCardContent>
                  <CreditHistory />
                </SoftCardContent>
              </SoftCard>
            </div>
          </div>

          <GiveCreditButton />
        </>
      ) : (
        <div className="max-w-md mx-auto p-6">
          <SoftCard>
            <SoftCardContent>
              <AuthError />
            </SoftCardContent>
          </SoftCard>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}