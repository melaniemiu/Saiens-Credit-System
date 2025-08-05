"use client"

import { useState, useRef, useEffect } from "react"
import { GiveCreditForm } from "@/components/give-credit-form"
import { CreditHistory, type CreditHistoryRef } from "@/components/credit-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard } from "lucide-react"
import { useSocket } from "@/context/socket-context"

export default function CreditPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const creditHistoryRef = useRef<CreditHistoryRef | null>(null)
  const { socket } = useSocket()

  // Function to trigger history refresh when credit is given or received
  const handleCreditUpdate = () => {
    // Trigger refresh in credit history component
    if (creditHistoryRef.current?.refreshHistory) {
      creditHistoryRef.current.refreshHistory()
    }
    // Also increment refresh trigger as fallback
    setRefreshTrigger(prev => prev + 1)
  }

  // Function to trigger history refresh when credit is given
  const handleCreditGiven = () => {
    handleCreditUpdate()
  }

  // Listen for credit received events via socket
  useEffect(() => {
    if (socket) {
      const handleCreditReceived = () => {
        console.log('Credit received - refreshing history')
        handleCreditUpdate()
      }

      // Listen for credit notifications
      socket.on('credit_notification', handleCreditReceived)

      return () => {
        socket.off('credit_notification', handleCreditReceived)
      }
    }
  }, [socket])

  return (
    <div className="w-full px-6 py-6 mx-auto">
      <div className="space-y-6">
        {/* Page Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-green-600" />
              <CardTitle>Credit 管理</CardTitle>
            </div>
            <CardDescription>發送表彰 Credits 與查看 Credit 歷程記錄</CardDescription>
          </CardHeader>
        </Card>

        {/* Responsive Layout: Desktop (left/right), Mobile (up/down) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side (Desktop) / Top (Mobile) - Give Credit */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>發送 Credit</CardTitle>
                <CardDescription>選擇同事並填寫表彰原因，每日可發送的次數有限</CardDescription>
              </CardHeader>
              <CardContent>
                <GiveCreditForm onCreditGiven={handleCreditGiven} />
              </CardContent>
            </Card>
          </div>

          {/* Right side (Desktop) / Bottom (Mobile) - Credit History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Credit 歷程</CardTitle>
                <CardDescription>查看您的 Credit 表彰記錄</CardDescription>
              </CardHeader>
              <CardContent>
                <CreditHistory 
                  ref={creditHistoryRef} 
                  refreshTrigger={refreshTrigger} 
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}