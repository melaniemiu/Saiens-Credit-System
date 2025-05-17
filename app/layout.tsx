import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { LiffInit } from "@/components/liff-init"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Saiens Credit System",
  description: "山恩互動表彰系統",
  generator: 'v0.dev',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={inter.className}>
        {/* 背景容器 */}
        <div className="min-h-screen relative bg-gradient-to-br from-gray-50 via-white to-gray-50/40">
          {/* 細微的網格圖案 */}
          <div className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(0,0,0,0.03) 30px, rgba(0,0,0,0.03) 31px)`
            }}>
          </div>

          {/* 主要內容 */}
          <div className="relative z-10">
            <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
              <AuthProvider>
                {/* LIFF initializer component */}
                <LiffInit />
                {children}
              </AuthProvider>
              <Toaster />
            </ThemeProvider>
          </div>
        </div>
      </body>
    </html>
  )
}
