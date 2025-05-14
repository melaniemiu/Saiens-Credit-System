"use client"

import { useEffect, useState } from "react"
import { initializeOnce, isInLiffBrowser, getProfile, getIdToken, liff } from "@/lib/direct-liff"
import { Button } from "@/components/ui/button"
import { LineIcon } from "./line-icon"

// Ultra simplified LINE login component for mobile
export function UltraSimpleLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Detect if we're in the LINE browser
    const isInLine = isInLiffBrowser()
    console.log("[ULTRA] In LINE browser:", isInLine)

    // If we're not in LINE, don't try auto-login
    if (!isInLine) return

    // Set loading state
    setIsLoading(true)
    setMessage("初始化中...")

    // Most direct possible approach for mobile
    initializeOnce()
      .then(() => {
        console.log("[ULTRA] LIFF initialized successfully")
        setMessage("取得使用者資料...")
        
        try {
          // Check if we're logged in
          const isLoggedIn = liff.isLoggedIn()
          console.log("[ULTRA] Is logged in:", isLoggedIn)
          
          if (isLoggedIn) {
            // Get profile
            getProfile()
              .then(profile => {
                console.log("[ULTRA] Got profile:", profile.displayName)
                
                // Get token
                const token = getIdToken()
                if (!token) {
                  setMessage("無法取得認證資料")
                  setIsLoading(false)
                  return
                }
                
                setMessage("登入中...")
                
                // Call API
                fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ idToken: token })
                })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    // Store token
                    localStorage.setItem("authToken", data.token)
                    sessionStorage.setItem("authToken", data.token)
                    
                    // Store user data
                    if (data.user) {
                      localStorage.setItem("user", JSON.stringify(data.user))
                      sessionStorage.setItem("user", JSON.stringify(data.user))
                    }
                    
                    // Redirect
                    setMessage("登入成功！重新導向...")
                    window.location.href = "/dashboard"
                  } else {
                    // Handle binding case
                    if (data.error?.includes("not registered") && data.lineData) {
                      const lineData = data.lineData
                      const params = lineData.userId ? 
                        `?lineUserId=${encodeURIComponent(lineData.userId)}` +
                        `&userName=${encodeURIComponent(lineData.name || '')}` +
                        `&picture=${encodeURIComponent(lineData.picture || '')}`
                        : ''
                      
                      window.location.href = `/bind${params}`
                    } else {
                      setMessage(data.error || "登入失敗")
                      setIsLoading(false)
                    }
                  }
                })
                .catch(err => {
                  console.error("[ULTRA] API error:", err)
                  setMessage("連線錯誤")
                  setIsLoading(false)
                })
              })
              .catch(err => {
                console.error("[ULTRA] Profile error:", err)
                setMessage("無法取得個人資料")
                setIsLoading(false)
              })
          } else {
            console.log("[ULTRA] Not logged in, redirecting to LINE login")
            liff.login()
          }
        } catch (e) {
          console.error("[ULTRA] Error after init:", e)
          setMessage("發生錯誤")
          setIsLoading(false)
        }
      })
      .catch(err => {
        console.error("[ULTRA] LIFF initialization error:", err)
        setMessage("LINE初始化失敗")
        setIsLoading(false)
      })
  }, [])
  
  // Manual login function
  const handleLogin = () => {
    try {
      setIsLoading(true)
      setMessage("登入中...")
      liff.login()
    } catch (e) {
      console.error("[ULTRA] Login error:", e)
      
      // Fallback to direct URL
      const redirectUri = encodeURIComponent(window.location.origin)
      const LIFF_ID = "2007394904-dYXDv6o9"
      window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LIFF_ID}&redirect_uri=${redirectUri}&state=123456&scope=profile%20openid&nonce=${Date.now()}`
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {isLoading && (
        <div className="text-center text-green-600 font-medium animate-pulse">
          {message}
        </div>
      )}
      <Button
        onClick={handleLogin}
        className="flex items-center gap-2 bg-[#06C755] hover:bg-[#06C755]/90"
        disabled={isLoading}
      >
        <LineIcon className="h-5 w-5" />
        {isLoading ? "處理中..." : "使用 LINE 登入"}
      </Button>
    </div>
  )
}