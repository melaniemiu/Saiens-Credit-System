"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api"
import { LineIcon } from "@/components/line-icon"
import { Loader2 } from "lucide-react"
import liff from '@line/liff'
import { setAuthToken } from "@/lib/api"
import { setCurrentUser } from "@/lib/auth"

export default function BindEmployeePage() {
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
    async function initLiff() {
      try {
        // Import the debug function
        const { debugAuthStorage } = await import('@/lib/auth')
        
        // Debug current storage
        console.log("Binding page - initial state:")
        debugAuthStorage()
        
        // Show welcome toast when the page loads
        toast({
          title: "連結帳號",
          description: "請輸入您的員工編號以連結帳號",
        })
        
        // Check URL for lineUserId parameter (in case we were redirected with this info)
        const params = new URLSearchParams(window.location.search)
        const urlLineUserId = params.get('lineUserId')
        const urlUserName = params.get('userName')
        const urlPicture = params.get('picture')
        
        if (urlLineUserId) {
          console.log("Using LINE user ID from URL parameters:", urlLineUserId)
          setLineUserId(urlLineUserId)
          setUserName(urlUserName || "LINE User")
          setPicture(urlPicture || null)
          setLoading(false)
          return
        }
        
        // Otherwise get data from LIFF
        console.log("No LINE parameters in URL, using LIFF API")
        const liffModule = await import('@line/liff')
        const liff = liffModule.default
        
        // Check if user is logged in with LIFF
        if (!liff.isLoggedIn()) {
          console.log("User not logged in with LINE, redirecting to login...")
          toast({
            title: "請先登入LINE",
            description: "將導向至登入頁面",
          })
          
          setTimeout(() => {
            router.push('/')
          }, 1000)
          return
        }

        // Get user profile
        const profile = await liff.getProfile()
        setLineUserId(profile.userId)
        setUserName(profile.displayName)
        setPicture(profile.pictureUrl || null)
        
        console.log("Successfully retrieved LINE profile for binding page:", profile.userId)
        setLoading(false)
      } catch (err) {
        console.error('Failed to initialize LIFF:', err)
        setError('Failed to get LINE profile. Please try again.')
        setLoading(false)
        
        // Redirect back to home if we can't get the LINE profile
        toast({
          title: "無法取得LINE資料",
          description: "請重新登入",
          variant: "destructive",
        })
        
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    }

    initLiff()
  }, [router, toast])

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
      let responseData;
      
      try {
        const response = await authApi.bindEmployeeId(employeeId, lineUserId)

        if (response.error || !response.data) {
          console.error("Employee ID binding error:", response.error)
          setError(response.error || "綁定失敗，請檢查員工編號是否正確")
          toast({
            title: "綁定失敗",
            description: response.error || "請檢查員工編號是否正確",
            variant: "destructive",
          })
          setSubmitting(false)
          return
        }
        
        // Store response data
        responseData = response.data;
      } catch (apiError) {
        console.error("API call failed:", apiError)
        setError("API 呼叫失敗，請聯繫管理員")
        toast({
          title: "系統錯誤",
          description: "API 呼叫失敗",
          variant: "destructive",
        })
        setSubmitting(false)
        return
      }

      // Success - save token and user data comprehensively
      if (responseData && responseData.token) {
        setAuthToken(responseData.token)
      
        // Set cookie directly as well (though response already includes it)
        if (typeof document !== 'undefined') {
          document.cookie = `user_session=${responseData.token}; path=/; max-age=${60 * 60 * 24}`;
        }
        
        // Create user object if user data is available
        if (responseData.user) {
          const backendUser = {
            id: responseData.user.id,
            name: responseData.user.name,
            email: responseData.user.email,
            picture: responseData.user.profilePicture,
            role: responseData.user.role,
            department: responseData.user.departmentName,
            employeeId: responseData.user.employeeId,
          };

          // Save user data
          setCurrentUser(backendUser);
          
          // Set additional auth flags for direct navigation
          sessionStorage.setItem('authenticated', 'true');
          localStorage.setItem('authenticated', 'true');
          
          // If admin, set admin flags
          if (backendUser.role === 'admin') {
            sessionStorage.setItem('is_admin', 'true');
            localStorage.setItem('is_admin', 'true');
          }
        
          // Remove any binding page flags
          try {
            sessionStorage.removeItem('on_binding_page');
          } catch (e) {
            console.error("Error removing binding flag:", e);
          }

          // Show success toast
          toast({
            title: "綁定成功",
            description: "即將前往儀表板",
          });

          // Use direct navigation with auth bypass for immediate access
          console.log("Direct navigation to dashboard with auth bypass");
          window.location.href = '/dashboard?auth_bypass=true';
        }
      }
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

            <div className="mt-6">
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