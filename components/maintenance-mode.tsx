"use client"

import { useSystemConfig } from "@/hooks/use-system-config"
import { useAuth } from "@/context/auth-context"
import { AlertTriangle, Settings, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface MaintenanceModeProps {
  children: React.ReactNode
}

export function MaintenanceMode({ children }: MaintenanceModeProps) {
  const { config, loading } = useSystemConfig()
  const { user } = useAuth()

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If maintenance mode is off, or user is admin, show normal app
  if (!config.maintenanceMode || user?.role === 'admin') {
    return <>{children}</>
  }

  // Show maintenance page for regular users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            系統維護中
          </CardTitle>
          <CardDescription className="text-gray-600">
            系統正在進行例行性維護，暫時無法使用
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>預計維護時間：約 30 分鐘</span>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>造成不便，敬請見諒</p>
            <p className="mt-1">如有緊急事務，請聯繫系統管理員</p>
          </div>

          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              重新整理頁面
            </Button>
          </div>
          
          {/* Admin login hint */}
          <div className="text-xs text-gray-400 flex items-center justify-center space-x-1">
            <Settings className="h-3 w-3" />
            <span>管理員可正常使用系統</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}