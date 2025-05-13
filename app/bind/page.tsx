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
const LIFF_ID = "2007394904-dYXDv6o9"

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
          return;
        }
        
        // No URL parameters, use LIFF
        console.log("No URL parameters, initializing LIFF directly")
        await liff.init({ liffId: LIFF_ID })
        console.log("LIFF initialized successfully")
        
        // Check if user is logged in with LIFF
        if (!liff.isLoggedIn()) {
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
      const response = await fetch("/api/auth/bind-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId, lineUserId }),
      })

      // Safely parse JSON response
      let data;
      try {
        const text = await response.text();
        // Log the raw response for debugging
        console.log("Raw API response:", text.substring(0, 200) + (text.length > 200 ? '...' : ''));
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
        }
      } catch (error) {
        console.error("Error reading response:", error);
        throw error;
      }

      if (!response.ok) {
        console.error("Employee ID binding error:", data)
        setError(data.error || "綁定失敗，請檢查員工編號是否正確")
        toast({
          title: "綁定失敗",
          description: data.error || "請檢查員工編號是否正確",
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
        
        // Set cookie directly (although browser will receive it from response)
        document.cookie = `user_session=${data.token}; path=/; max-age=${60 * 60 * 24}`;
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

      // Show success toast
      toast({
        title: "綁定成功",
        description: "即將前往儀表板",
      })
      
      // Remove the binding page flag to prevent redirection loops
      try {
        sessionStorage.removeItem('on_binding_page');
        console.log("Removed binding page flag before dashboard redirect");
      } catch (e) {
        console.error("Error removing binding flag:", e);
      }

      // Redirect to dashboard with direct navigation to bypass any middleware checks
      // Use a loading state to prevent any flicker
      setSubmitting(true);
      setError(null);
      
      // Redirect immediately with auth bypass parameter
      console.log("Direct navigation to dashboard with auth bypass");
      window.location.href = '/dashboard?auth_bypass=true';
    } catch (err) {
      console.error('Error during employee ID binding:', err)
      setError('系統錯誤，請稍後再試')
      toast({
        title: "系統錯誤",
        description: "請稍後再試",
        variant: "destructive",
      })
    } finally {
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