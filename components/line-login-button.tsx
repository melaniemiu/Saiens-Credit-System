"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { LineIcon } from "./line-icon"
import { initLiff, liff, isInLineBrowser, lineLogin } from "@/lib/liff-loader"

export function LineLoginButton() {
  const [isLiffInitialized, setIsLiffInitialized] = useState(false)
  const { login, loading: authLoading } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    console.log("LineLoginButton mounted, initializing LIFF");
    
    // Check if in LINE browser before initialization
    const isInLiff = isInLineBrowser();
    console.log("LIFF browser check (pre-init):", isInLiff);
    
    // Use the centralized LIFF loader
    initLiff()
      .then(success => {
        console.log("LIFF initialization result:", success ? "success" : "failed");
        setIsLiffInitialized(success);
      })
      .catch(error => {
        console.error("Error during LIFF initialization:", error);
        // Enable button anyway so users can still try to log in
        setIsLiffInitialized(true);
      });
  }, []);

  const handleLogin = () => {
    console.log("Login button clicked");
    
    // Clear any existing auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
    
    try {
      // Check if in LIFF browser directly
      const isInLiffBrowser = isInLineBrowser();
      console.log("LIFF browser check:", isInLiffBrowser);
      
      if (isInLiffBrowser) {
        // In LINE app - handle direct login
        console.log("In LINE app - getting token directly");
        
        toast({
          title: "登入中...",
          description: "正在取得LINE資料",
        });
        
        // Make sure LIFF is initialized first
        initLiff()
          .then(success => {
            if (!success) {
              throw new Error("LIFF could not be initialized");
            }
            
            // Timeout for profile request to prevent hanging
            return Promise.race([
              liff.getProfile(),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Profile request timed out")), 5000))
            ]);
          })
          .then(profile => {
            console.log("Got LINE profile:", profile.displayName);
            
            // Get ID token
            let idToken;
            try {
              idToken = liff.getIDToken();
              console.log("Got ID token, length:", idToken?.length || 0);
              
              if (!idToken) {
                throw new Error("ID token is empty");
              }
            } catch (tokenError) {
              console.error("Error getting ID token:", tokenError);
              throw new Error("Failed to get ID token");
            }
            
            // Call backend API with timeout
            console.log("Calling API with token");
            return fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ idToken }),
              // 10 second timeout for fetch
              signal: AbortSignal.timeout(10000),
            });
          })
          .then(response => {
            console.log("API response status:", response.status);
            return response.json();
          })
          .then(data => {
            console.log("API response:", data.success ? "success" : "error");
            
            if (data.success) {
              // Store user data
              if (data.token) {
                localStorage.setItem('authToken', data.token);
                sessionStorage.setItem('authToken', data.token);
              }
              
              if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.setItem('user', JSON.stringify(data.user));
              }
              
              // Success toast
              toast({
                title: "登入成功",
                description: `歡迎回來，${data.user?.name || ''}`,
              });
              
              // Navigate to dashboard after a short delay for toast visibility
              setTimeout(() => {
                console.log("Login successful, redirecting to dashboard");
                window.location.href = '/dashboard';
              }, 300);
            } else {
              console.error("Backend login error:", data.error);
              
              // Handle bind redirect
              if (data.error && data.error.includes("not registered") && data.lineData) {
                const lineData = data.lineData;
                const lineParams = lineData.userId ? 
                  `?lineUserId=${encodeURIComponent(lineData.userId)}` +
                  `&userName=${encodeURIComponent(lineData.name || '')}` +
                  `&picture=${encodeURIComponent(lineData.picture || '')}`
                  : '';
                
                console.log("Redirecting to binding page");
                window.location.href = `/bind${lineParams}`;
                return;
              }
              
              toast({
                title: "登入失敗",
                description: data.error || "請稍後再試",
                variant: "destructive",
              });
            }
          })
          .catch(error => {
            console.error("Login process error:", error);
            
            toast({
              title: "登入失敗",
              description: "連線錯誤，請重新嘗試",
              variant: "destructive",
            });
          });
      } else {
        // Regular browser - use centralized LINE login
        console.log("Regular browser - using LINE login function");
        lineLogin();
      }
    } catch (error) {
      console.error("General login error:", error);
      toast({
        title: "登入失敗",
        description: "發生錯誤，請重新嘗試",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleLogin}
      className="flex items-center gap-2 bg-[#06C755] hover:bg-[#06C755]/90"
      disabled={authLoading}
    >
      <LineIcon className="h-5 w-5" />
      {authLoading ? "登入中..." : "使用 LINE 登入"}
    </Button>
  );
}