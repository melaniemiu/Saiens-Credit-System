"use client"

import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { AlertCircle, LogIn, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AuthError() {
  const [storageInfo, setStorageInfo] = useState({
    hasToken: false,
    hasUser: false,
    hasLineProfile: false
  })
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check storage for auth data
      const authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')
      const user = sessionStorage.getItem('user') || localStorage.getItem('user')
      const lineProfile = sessionStorage.getItem('lineProfile') || localStorage.getItem('lineProfile')

      // Check for auth token in storage
      const hasAuthToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')

      setStorageInfo({
        hasToken: !!authToken || !!hasAuthToken,
        hasUser: !!user,
        hasLineProfile: !!lineProfile
      })

      console.log("Auth status check:");
      console.log("- Token in storage:", !!authToken);
      console.log("- User in storage:", !!user);
      console.log("- LINE Profile in storage:", !!lineProfile);
      console.log("- Auth token present:", !!hasAuthToken);
    }
  }, [])

  // Handle login
  const handleLogin = () => {
    router.push('/')
  }

  // Handle refresh
  const handleRefresh = () => {
    window.location.reload()
  }

  // Clear storage and redirect to login
  const handleClearAndLogin = () => {
    // Clear all storage
    sessionStorage.clear()
    localStorage.clear()
    // Redirect to login
    window.location.href = '/'
  }

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>認證錯誤</AlertTitle>
        <AlertDescription>
          無法載入您的資料，請重新登入或重新整理頁面
        </AlertDescription>
      </Alert>

      <div className="storage-info space-y-2">
        <p>登入狀態檢查:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Token: {storageInfo.hasToken ? '✅' : '❌'}</li>
          <li>User: {storageInfo.hasUser ? '✅' : '❌'}</li>
          <li>LINE Profile: {storageInfo.hasLineProfile ? '✅' : '❌'}</li>
        </ul>
      </div>

      <div className="flex flex-col space-y-2">
        <Button onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          重新整理
        </Button>
        <Button onClick={handleLogin} variant="outline" className="gap-2">
          <LogIn className="h-4 w-4" />
          返回登入頁
        </Button>
        <Button onClick={handleClearAndLogin} variant="destructive" className="gap-2">
          清除資料並重新登入
        </Button>
      </div>
    </div>
  )
}