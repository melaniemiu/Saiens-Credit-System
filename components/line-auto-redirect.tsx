"use client"

import { useEffect, useState } from "react"
import { liff } from "@line/liff"
import { Loader2 } from "lucide-react"

// The LIFF ID must be hardcoded to avoid problems with environment variables on mobile
const LIFF_ID = "2007394904-dYXDv6o9"

export function LineAutoRedirect() {
  const [status, setStatus] = useState("初始化中...")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Minimal LIFF initialization and redirect
    const autoLogin = async () => {
      try {
        // Initialize LIFF with minimal approach
        setStatus("連線至LINE...")
        console.log("[AutoRedirect] Initializing LIFF")
        
        await liff.init({ liffId: LIFF_ID })
        console.log("[AutoRedirect] LIFF initialized")
        
        // Check if logged in with LINE
        const isLoggedIn = liff.isLoggedIn()
        console.log("[AutoRedirect] Is logged in:", isLoggedIn)
        
        if (!isLoggedIn) {
          console.log("[AutoRedirect] Not logged in, redirecting to LINE login")
          setStatus("需要LINE授權，即將轉向...")
          // Just redirect to LINE login immediately
          setTimeout(() => {
            liff.login()
          }, 500)
          return
        }
        
        // Get profile
        setStatus("取得個人資料...")
        console.log("[AutoRedirect] Getting profile")
        const profile = await liff.getProfile()
        console.log("[AutoRedirect] Got profile:", profile.displayName)
        
        // Get ID token
        const idToken = liff.getIDToken()
        if (!idToken) {
          setError("無法取得授權資料")
          return
        }
        
        // Call login API
        setStatus("驗證中，請稍候...")
        console.log("[AutoRedirect] Calling login API")
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken })
        })
        
        const data = await response.json()
        
        if (data.success) {
          // Store auth data
          console.log("[AutoRedirect] Login successful")
          
          if (data.token) {
            localStorage.setItem("authToken", data.token)
            sessionStorage.setItem("authToken", data.token)
          }
          
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user))
            sessionStorage.setItem("user", JSON.stringify(data.user))
          }
          
          // Redirect to dashboard
          setStatus("登入成功！轉向中...")
          console.log("[AutoRedirect] Redirecting to dashboard")
          
          // Short timeout to avoid any race conditions
          setTimeout(() => {
            window.location.href = "/dashboard"
          }, 300)
        } else {
          // Handle binding case
          if (data.error?.includes("not registered") && data.lineData) {
            console.log("[AutoRedirect] Need to bind employee ID")
            setStatus("需要綁定員工帳號，轉向中...")
            
            // Construct binding URL
            const lineData = data.lineData
            const params = lineData.userId ? 
              `?lineUserId=${encodeURIComponent(lineData.userId)}` +
              `&userName=${encodeURIComponent(lineData.name || '')}` +
              `&picture=${encodeURIComponent(lineData.picture || '')}`
              : ''
            
            // Redirect to binding page
            setTimeout(() => {
              window.location.href = `/bind${params}`
            }, 300)
          } else {
            // Show error
            setError(data.error || "登入失敗")
          }
        }
      } catch (e) {
        console.error("[AutoRedirect] Error:", e)
        setError("發生錯誤，請重新嘗試")
      }
    }
    
    // Start auto-login process
    autoLogin()
  }, [])
  
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-4">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      {!error ? (
        <p className="text-green-600 font-medium">{status}</p>
      ) : (
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            重新嘗試
          </button>
        </div>
      )}
    </div>
  )
}