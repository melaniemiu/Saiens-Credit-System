"use client"

import { useSystemConfig } from "@/hooks/use-system-config"
import { useAuth } from "@/context/auth-context"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"

export function MaintenanceNotice() {
  const { config, loading } = useSystemConfig()
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  // Only show to admins when maintenance mode is enabled
  if (loading || !config.maintenanceMode || user?.role !== 'admin' || dismissed) {
    return null
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mx-4 mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          <strong>維護模式已啟用</strong> - 一般用戶無法存取系統，僅管理員可正常使用
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="ml-2 h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}