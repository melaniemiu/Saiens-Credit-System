"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { LineIcon } from "@/components/line-icon"
import { Loader2 } from "lucide-react"
import liff from '@line/liff'
import { clearAuthStorage } from "@/lib/auth"

// Hardcoded LIFF ID - use environment variable in production
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "2007394904-dYXDv6o9"

export default function BindPage() {
  const [employeeId, setEmployeeId] = useState("")
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [picture, setPicture] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Store a flag in sessionStorage to prevent automatic login redirects
    try {
      sessionStorage.setItem('on_binding_page', 'true');
      // Clear any auto-login processed flag to ensure we can complete the binding process
      sessionStorage.removeItem('auto_login_processed');
    } catch (e) {
      console.error("Failed to set sessionStorage flag:", e);
    }

    async function initLiff() {
      try {
        console.log("Initializing LIFF in standalone bind page...")

        // Clear any previous auth data
        clearAuthStorage()

        // Directly get LINE profile from URL parameters if available
        const urlParams = new URLSearchParams(window.location.search);
        const urlLineUserId = urlParams.get('lineUserId');
        const urlUserName = urlParams.get('userName');
        const urlPicture = urlParams.get('picture');

        if (urlLineUserId) {
          console.log("Using LINE user ID from URL parameters:", urlLineUserId);
          setLineUserId(urlLineUserId);
          setUserName(urlUserName || "LINE User");
          setPicture(urlPicture || null);
          setLoading(false);

          // Show welcome toast with URL parameters
          toast({
            title: "連結帳號",
            description: "請輸入您的員工編號以連結帳號",
          });

          return;
        }

        // No URL parameters, use LIFF
        console.log("No URL parameters, initializing LIFF directly")
        await liff.init({ liffId: LIFF_ID })
        console.log("LIFF initialized successfully")

        // Check if we're in LIFF browser - it's always logged in in this case
        const isInLiffBrowser = liff.isInClient();

        // Check if user is logged in with LIFF
        if (!liff.isLoggedIn() && !isInLiffBrowser) {
          console.log("User not logged in with LINE, initiating login...")
          toast({
            title: "請登入LINE",
            description: "需要先進行LINE登入",
          })
          // Delay login to allow toast to be seen
          setTimeout(() => {
            liff.login()
          }, 1000)
          return
        }

        // Get user profile
        const profile = await liff.getProfile()
        console.log("Got LINE profile for binding:", profile.userId)
        setLineUserId(profile.userId)
        setUserName(profile.displayName)
        setPicture(profile.pictureUrl || null)

        // Show welcome toast
        toast({
          title: "連結帳號",
          description: "請輸入您的員工編號以連結帳號",
        })

        setLoading(false)
      } catch (err) {
        console.error('Failed to initialize LIFF:', err)
        setError('LINE登入服務初始化失敗，請重新嘗試')
        setLoading(false)

        toast({
          title: "LINE初始化失敗",
          description: "請重新嘗試或重新載入頁面",
          variant: "destructive",
        })
      }
    }

    initLiff()

    // Cleanup on component unmount
    return () => {
      try {
        // Remove the binding page flag when navigating away
        sessionStorage.removeItem('on_binding_page');
        console.log("Removed binding page flag on cleanup");
      } catch (e) {
        console.error("Failed to clean up sessionStorage:", e);
      }
    }
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeId.trim()) {
      toast({
        title: "請輸入員工編號",
        description: "員工編號不能為空",
        variant: "destructive",
      })
      return
    }

    if (!lineUserId) {
      toast({
        title: "LINE 登入錯誤",
        description: "無法取得 LINE 用戶 ID，請重新登入",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      console.log("Submitting bind request with employeeId:", employeeId, "lineUserId:", lineUserId);

      const response = await fetch("/api/auth/bind-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId, lineUserId, profilePicture: picture }),
      })

      console.log("Response received, status:", response.status);

      // Safely parse JSON response
      let data = {};
      const text = await response.text();
      console.log("Raw response text:", text);

      try {
        if (text) {
          data = JSON.parse(text);
          console.log("Parsed response data:", data);
        }
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        data = { error: text || "Invalid server response" };
      }

      if (!response.ok) {
        console.error("Employee ID binding failed");
        console.log("Response status:", response.status);
        console.log("Response data:", data);

        // Default error message
        let errorMessage = "綁定失敗";
        let errorDescription = "請檢查員工編號是否正確";

        // Extract error details from response
        if (data.detail) {
          errorDescription = data.detail;
        } else if (data.error) {
          errorDescription = data.error;
        } else if (data.message) {
          errorDescription = data.message;
        }

        // Check for specific error cases based on response status
        if (response.status === 409) {
          errorMessage = "綁定失敗";
          // Check the actual message content
          const msgContent = data.message || data.error || "";
          if (msgContent.includes("Employee already linked")) {
            errorDescription = "此員工編號已連結至其他LINE帳號，請聯繫管理員";
          } else if (msgContent.includes("LINE account already linked")) {
            errorDescription = "此LINE帳號已連結至其他員工編號";
          } else if (data.detail) {
            // Use the detail field directly
            errorDescription = data.detail;
          }
        } else if (response.status === 404) {
          errorMessage = "員工編號錯誤";
          if (data.detail) {
            errorDescription = data.detail;
          } else {
            errorDescription = "系統中找不到此員工編號，請確認輸入是否正確";
          }
        }

        console.log("Final error message:", errorMessage, "Description:", errorDescription);

        setError(errorDescription)
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      // Success - save token and user data more comprehensively
      if (data.token) {
        // Save auth token in both storages
        localStorage.setItem("authToken", data.token)
        sessionStorage.setItem("authToken", data.token)

        // No need to set cookies - JWT token is stored in localStorage/sessionStorage
      }

      if (data.user) {
        // Save user data in both storages
        localStorage.setItem("user", JSON.stringify(data.user))
        sessionStorage.setItem("user", JSON.stringify(data.user))

        // If admin, set a flag
        if (data.user.role === 'admin') {
          sessionStorage.setItem('is_admin', 'true');
          localStorage.setItem('is_admin', 'true');
        }
      }

      // Set all authentication flags
      sessionStorage.setItem('authenticated', 'true');
      localStorage.setItem('authenticated', 'true');

      // Mark that auto-login is now processed to prevent repeat logins
      sessionStorage.setItem('auto_login_processed', 'true');

      // Show success toast
      toast({
        title: "綁定成功",
        description: "即將前往儀表板",
      })

      // Set all flags needed for smooth transition to dashboard
      try {
        // Remove binding page flag
        sessionStorage.removeItem('on_binding_page');

        // Set flag to skip auto-login redirects
        if (liff.isInClient()) {
          // In LIFF browser, we need these extra flags to ensure smooth transition
          sessionStorage.setItem('dashboard_direct', 'true');
          localStorage.setItem('dashboard_direct', 'true');
        }

        console.log("Updated session flags before dashboard redirect");
      } catch (e) {
        console.error("Error updating session flags:", e);
      }

      // Redirect to dashboard with direct navigation to bypass any middleware checks
      // Use a loading state to prevent any flicker
      setSubmitting(true);
      setError(null);

      // Redirect immediately with auth bypass parameter
      console.log("Direct navigation to dashboard with auth bypass");

      // For LIFF browser, need different approach to avoid redirect loop
      if (liff.isInClient()) {
        // Use more direct approach in LIFF browser
        window.location.replace('/dashboard?auth_bypass=true');
      } else {
        // Standard navigation for non-LIFF browser
        window.location.href = '/dashboard?auth_bypass=true';
      }
    } catch (err) {
      // This should only run for network errors or unexpected exceptions
      console.error('Unexpected error during employee ID binding:', err)

      let errorMsg = '系統錯誤，請稍後再試';
      if (err instanceof Error && err.message !== 'Error during employee ID binding') {
        errorMsg = err.message;
      }

      setError(errorMsg)
      toast({
        title: "系統錯誤",
        description: errorMsg,
        variant: "destructive",
      })
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          <p className="text-xl font-medium text-gray-700">
            載入中，請稍候...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">連結員工帳號</CardTitle>
          <CardDescription className="text-center">
            請輸入您的員工編號來完成註冊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-green-500">
              {picture ? (
                <img src={picture} alt={userName || "USER"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-green-100 text-green-700">
                  {userName?.substring(0, 1) || "U"}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-center">
              <LineIcon className="mr-1 h-4 w-4" />
              <span className="font-medium">{userName}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                  員工編號
                </label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="請輸入員工編號"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={submitting}
                  className="w-full"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    處理中...
                  </>
                ) : (
                  "繼續"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-gray-500">
          <p>如果您不知道您的員工編號，請聯繫管理員</p>
        </CardFooter>
      </Card>
    </div>
  )
}
