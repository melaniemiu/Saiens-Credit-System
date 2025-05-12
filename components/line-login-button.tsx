"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import liff from "@line/liff"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { LineIcon } from "./line-icon"

// Hardcoded LIFF ID - use environment variable in production
const LIFF_ID = "2007394904-dYXDv6o9"

export function LineLoginButton() {
  const [isLiffInitialized, setIsLiffInitialized] = useState(false)
  const { login, loading: authLoading } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Initialize LIFF
    const initializeLiff = async () => {
      try {
        console.log("Initializing LIFF with ID:", LIFF_ID)
        await liff.init({ liffId: LIFF_ID })
        console.log("LIFF initialized successfully")
        setIsLiffInitialized(true)
      } catch (error) {
        console.error("LIFF initialization failed", error)
        toast({
          title: "初始化失敗",
          description: "LINE 登入服務初始化失敗，請稍後再試",
          variant: "destructive",
        })
      }
    }

    initializeLiff()
  }, [toast])

  const handleLogin = async () => {
    try {
      // Force logout and re-login to avoid expired token issues
      if (liff.isLoggedIn()) {
        console.log("Logging out to refresh session...")
        liff.logout()
      }

      // Open LINE login dialog - always use fresh login
      console.log("Initiating LINE login...")
      liff.login()
    } catch (error) {
      console.error("Login failed", error)
      toast({
        title: "登入失敗",
        description: "LINE 登入失敗，請稍後再試",
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      onClick={handleLogin}
      className="flex items-center gap-2 bg-[#06C755] hover:bg-[#06C755]/90"
      disabled={!isLiffInitialized || authLoading}
    >
      <LineIcon className="h-5 w-5" />
      {authLoading ? "登入中..." : "使用 LINE 登入"}
    </Button>
  )
}