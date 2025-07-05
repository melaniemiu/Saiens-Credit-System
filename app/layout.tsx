import type React from "react"
import { Inter, Open_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { SocketProvider } from "@/context/socket-context"
import { EvaluationProvider } from "@/context/evaluation-context"
import { LiffInit } from "@/components/liff-init"
import { GlobalEvaluationModal } from "@/components/global-evaluation-modal"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const openSans = Open_Sans({ 
  subsets: ["latin"],
  variable: '--font-open-sans'
})

export const metadata = {
  title: "Saiens Credit System",
  description: "山恩互動表彰系統",
  generator: 'v0.dev'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700" rel="stylesheet" />
      </head>
      <body className={`${inter.className} ${openSans.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
          <AuthProvider>
            <EvaluationProvider>
              <SocketProvider>
                {/* LIFF initializer component */}
                <LiffInit />
                {children}
                <GlobalEvaluationModal />
              </SocketProvider>
            </EvaluationProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
