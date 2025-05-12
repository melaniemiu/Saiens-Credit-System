"use client"

import { LineLoginButton } from "@/components/line-login-button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRedirect, setIsRedirect] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    console.log("Home page - Auth state:", user ? "User authenticated" : "No user");

    // If user is already authenticated, redirect to dashboard
    if (user) {
      console.log("Home page - Redirecting authenticated user to dashboard");
      // Using direct navigation to avoid loops
      window.location.href = "/dashboard";
      return;
    }

    // Check if this is a LINE redirect with code parameter
    const url = new URL(window.location.href);
    const hasCode = url.searchParams.has('code');
    if (hasCode) {
      console.log("Home page - Detected LINE redirect code");
      setIsRedirect(true);
    }
  }, [user])

  // If we're in the middle of a LINE redirect, show loading
  if (isRedirect || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          <p className="text-xl font-medium text-gray-700">登入處理中，請稍候...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600">山恩實業</h1>
          <h2 className="text-2xl font-bold text-green-600 mt-2">員工互動表彰系統</h2>
          <p className="mt-2 text-gray-600">使用 LINE 帳號登入以開始使用</p>
        </div>

        <div className="mt-8 flex justify-center">
          <LineLoginButton />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>登入後即可查看您的 credit 並向同事表達感謝</p>
        </div>
      </div>
    </div>
  )
}
