import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Skeleton } from "@/components/ui/skeleton"

interface CreditStats {
  totalReceived: number
  todayReceived: number
  yesterdayReceived: number
  dayBeforeReceived: number
  remainingDailyCredits: number
  dailyLimit: number
}

export function CreditStats() {
  const [stats, setStats] = useState<CreditStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.getDailyStats()

        if (response.data?.stats) {
          setStats(response.data.stats)
        }
      } catch (error) {
        console.error("Failed to fetch daily stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <Card className="flex-1 border-none shadow-lg bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardHeader className="relative z-10 pb-3">
        <CardTitle className="text-base font-semibold text-gray-800">Credit 統計</CardTitle>
        <CardDescription className="text-xs text-gray-600">您的 Credit 統計資訊</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center py-1 px-2 rounded bg-green-50/50 hover:bg-green-50 transition-colors duration-200">
                <span className="text-xs font-medium text-gray-700">總收到</span>
                <span className="font-bold text-lg text-green-600">
                  {stats.totalReceived}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 transition-colors duration-200">
                <span className="text-xs font-medium text-gray-600">今天收到</span>
                <span className="text-sm font-medium text-gray-900">{stats.todayReceived}</span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 transition-colors duration-200">
                <span className="text-xs font-medium text-gray-600">昨天收到</span>
                <span className="text-sm font-medium text-gray-900">{stats.yesterdayReceived}</span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 transition-colors duration-200">
                <span className="text-xs font-medium text-gray-600">前天收到</span>
                <span className="text-sm font-medium text-gray-900">{stats.dayBeforeReceived}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">今日剩餘可發送次數</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.remainingDailyCredits} / {stats.dailyLimit}
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={(stats.remainingDailyCredits / stats.dailyLimit) * 100}
                  className="h-1.5 bg-gray-100"
                />
                <div className="absolute inset-0 h-1.5 bg-gradient-to-r from-green-400/20 to-green-600/20 rounded-full" style={{width: `${(stats.remainingDailyCredits / stats.dailyLimit) * 100}%`}}></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">無法載入數據</div>
        )}
      </CardContent>
    </Card>
  )
}
