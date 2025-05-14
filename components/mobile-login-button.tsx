"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LineIcon } from "./line-icon"
import { initLiffMobile, isInLineBrowser, liff, getLineProfile, getIdToken } from "@/lib/mobile-liff"

export function MobileLoginButton() {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Define login logic in a memoized callback that can be used in both useEffect and button click
  const performLogin = useCallback(async () => {
    // Skip if already loading
    if (isLoading) return;
    
    try {
      setIsLoading(true)

      // Show loading toast
      toast({
        title: "登入中...",
        description: "正在連線至LINE",
      })

      // Check if we're in the LINE app
      const isInLiff = isInLineBrowser()
      console.log("[Mobile] In LINE browser (login):", isInLiff)

      if (isInLiff) {
        // Get profile directly, don't check isLoggedIn first on mobile
        console.log("[Mobile] Getting profile directly")
        
        try {
          // Get profile
          const profile = await getLineProfile()
          console.log("[Mobile] Got profile:", profile.displayName)
          
          // Get ID token
          const idToken = getIdToken()
          console.log("[Mobile] Got ID token:", !!idToken)
          
          if (!idToken) {
            throw new Error("No ID token available")
          }
          
          // Call the login API
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          })
          
          const data = await response.json()
          
          if (data.success) {
            // Store auth data
            if (data.token) {
              localStorage.setItem('authToken', data.token)
              sessionStorage.setItem('authToken', data.token)
            }
            
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user))
              sessionStorage.setItem('user', JSON.stringify(data.user))
            }
            
            // Success toast
            toast({
              title: "登入成功",
              description: `歡迎回來，${data.user?.name || ''}`,
            })
            
            // Redirect to dashboard
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 300)
          } else {
            // Check for binding redirect
            if (data.error && data.error.includes("not registered") && data.lineData) {
              const lineData = data.lineData
              const lineParams = lineData.userId ? 
                `?lineUserId=${encodeURIComponent(lineData.userId)}` +
                `&userName=${encodeURIComponent(lineData.name || '')}` +
                `&picture=${encodeURIComponent(lineData.picture || '')}`
                : ''
              
              window.location.href = `/bind${lineParams}`
              return
            }
            
            // Show error
            toast({
              title: "登入失敗",
              description: data.error || "請稍後再試",
              variant: "destructive",
            })
          }
        } catch (profileError) {
          console.error("[Mobile] Profile error:", profileError)
          
          // Try to login instead
          try {
            liff.login()
          } catch (loginError) {
            console.error("[Mobile] Login error:", loginError)
            
            toast({
              title: "登入失敗",
              description: "無法連線至LINE",
              variant: "destructive",
            })
          }
        }
      } else {
        // Not in LINE browser, use direct login
        try {
          console.log("[Mobile] Using direct login")
          liff.login()
        } catch (e) {
          console.error("[Mobile] Login error:", e)
          
          // Fallback to direct URL
          const redirectUri = encodeURIComponent(window.location.origin)
          const LIFF_ID = "2007394904-dYXDv6o9"
          window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LIFF_ID}&redirect_uri=${redirectUri}&state=123456&scope=profile%20openid&nonce=${Date.now()}`
        }
      }
    } catch (error) {
      console.error("[Mobile] General login error:", error)
      
      toast({
        title: "登入失敗",
        description: "請重新嘗試",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, toast]); // Add dependencies

  // Button click handler uses the same login logic
  const handleLogin = () => performLogin();
  
  // useEffect for automatic login in LINE browser
  useEffect(() => {
    // On mount, check if in LINE browser
    const isInLiff = isInLineBrowser()
    console.log("[Mobile] In LINE browser:", isInLiff)

    // Initialize LIFF regardless - mobile simplified approach
    initLiffMobile()
      .then(success => {
        console.log("[Mobile] LIFF initialization result:", success ? "success" : "failed")
        // Enable button regardless to allow fallbacks
        setIsReady(true)
        
        // Auto-login if in LIFF browser
        if (success && isInLiff) {
          console.log("[Mobile] Auto-login initiating...")
          // Slight delay to ensure LIFF is fully ready
          setTimeout(() => {
            performLogin()
          }, 500)
        }
      })
      .catch(err => {
        console.error("[Mobile] LIFF initialization error:", err)
        // Enable button for fallback
        setIsReady(true)
      })
  }, [performLogin]) // Include performLogin in deps array

  return (
    <Button
      onClick={handleLogin}
      className="flex items-center gap-2 bg-[#06C755] hover:bg-[#06C755]/90"
      disabled={isLoading || !isReady}
    >
      <LineIcon className="h-5 w-5" />
      {isLoading ? "登入中..." : "使用 LINE 登入"}
    </Button>
  )
}