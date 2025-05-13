"use client"

import React, { useEffect, useState, useRef } from "react"
import { LineLoginButton } from "@/components/line-login-button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isRedirect, setIsRedirect] = useState(false)
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false)

  // Initialize isRedirect based on URL on first render
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    console.log("Home page - Auth state:", user ? "User authenticated" : "No user");
    
    // If we're already in a redirect state, don't do anything
    if (isRedirect) return;
    
    // Function to check for auth redirection flag
    const checkRedirectFlag = () => {
      try {
        const redirectFlag = sessionStorage.getItem('auth_redirect');
        if (redirectFlag) {
          console.log(`Home page - Auth redirect flag found: ${redirectFlag}`);
          
          // Clear the redirect flag
          sessionStorage.removeItem('auth_redirect');
          
          // If the flag is 'bind-employee' and we're not already there, redirect
          if (redirectFlag === 'bind-employee' && window.location.pathname !== '/bind-employee') {
            console.log("Home page - Redirecting to bind-employee page based on flag");
            window.location.href = '/bind-employee';
            return true;
          }
        }
      } catch (e) {
        console.error("Error checking redirect flag:", e);
      }
      return false;
    };
    
    // Check for auth redirect flag first
    if (checkRedirectFlag()) {
      return;
    }
    
    // If user is already authenticated, redirect to dashboard
    if (user) {
      console.log("Home page - Redirecting authenticated user to dashboard");
      window.location.href = "/dashboard";
      return;
    }
    
    // Check if this is a LINE redirect by looking for code parameter
    try {
      // Check if we've already processed this code
      const processedCode = sessionStorage.getItem('processed_code');
      const url = new URL(window.location.href);
      const currentCode = url.searchParams.get('code');
      
      // Only handle code param if it exists and we haven't processed it yet
      if (currentCode && (!processedCode || processedCode !== currentCode)) {
        console.log("Home page - New LINE redirect code detected");
        
        // Mark this code as processed
        sessionStorage.setItem('processed_code', currentCode);
        
        // Show redirect loading state
        setIsRedirect(true);
        
        // Set timeout to show error message if redirect takes too long
        setTimeout(() => {
          // Check for redirect flag again before showing error
          if (!checkRedirectFlag()) {
            console.log("Home page - Loading timeout reached");
            setIsRedirect(false);
            setShowTimeoutMessage(true);
          }
        }, 10000);
      }
    } catch (error) {
      console.error("Error checking URL params:", error);
    }
  }, [user, isRedirect]);
  
  // If we're in the middle of a LINE redirect, show loading state
  if (isRedirect || loading) {
    // Check if we're coming from logout (using URL parameters safely)
    const isLogout = (() => {
      try {
        // Only run this on client-side
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          return url.searchParams.has('logout');
        }
        return false;
      } catch (e) {
        return false;
      }
    })();

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          <p className="text-xl font-medium text-gray-700">
            {isLogout ? "已登出系統，請重新登入" : "登入處理中，請稍候..."}
          </p>
          
          {showTimeoutMessage && (
            <div className="mt-4 text-center">
              <p className="text-red-600">登入處理時間過長</p>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }} 
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                重新載入
              </button>
            </div>
          )}
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
