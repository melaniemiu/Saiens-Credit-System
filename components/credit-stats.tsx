import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from 'react'
import { userApi } from '@/lib/api'
import { useAuth } from '@/context/auth-context'
import { Skeleton } from "@/components/ui/skeleton"

interface CreditStats {
  creditsReceived: number
  creditsGiven: number
  dailyLimit: number
  remainingDailyCredits: number
}

export function CreditStats() {
  const [stats, setStats] = useState<CreditStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await userApi.getCurrentUser()

        if (response.data?.user) {
          setStats({
            creditsReceived: response.data.user.creditsReceived || 0,
            creditsGiven: response.data.user.creditsGiven || 0,
            dailyLimit: Number(process.env.NEXT_PUBLIC_DAILY_CREDIT_LIMIT || 5),
            remainingDailyCredits: response.data.user.remainingDailyCredits || 0
          })
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Use user data if available, otherwise fetch
    if (user) {
      setStats({
        creditsReceived: user.creditsReceived || 0,
        creditsGiven: user.creditsGiven || 0,
        dailyLimit: Number(process.env.NEXT_PUBLIC_DAILY_CREDIT_LIMIT || 5),
        remainingDailyCredits: user.remainingDailyCredits || 0
      })
      setIsLoading(false)
    } else {
      fetchStats()
    }
  }, [user])

  return (
    <Card className="flex-1 border-none shadow-lg bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardHeader className="relative z-10 pb-3">
        <CardTitle className="text-base font-semibold text-gray-800">Credit 統計</CardTitle>
        <CardDescription className="text-xs text-gray-600">您的 Credit 數量與使用情況</CardDescription>
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
                <span className="text-xs font-medium text-gray-700">目前 Credit</span>
                <span className="font-bold text-lg text-green-600">
                  {stats.creditsReceived - stats.creditsGiven || 50}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 transition-colors duration-200">
                <span className="text-xs font-medium text-gray-600">已收到</span>
                <span className="text-sm font-medium text-gray-900">{stats.creditsReceived || 75}</span>
              </div>
              <div className="flex justify-between items-center py-1 px-2 rounded hover:bg-gray-50 transition-colors duration-200">
                <span className="text-xs font-medium text-gray-600">已送出</span>
                <span className="text-sm font-medium text-gray-900">{stats.creditsGiven || 25}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">今日剩餘可送出</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.remainingDailyCredits || 3} / {stats.dailyLimit || 5}
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={((stats.remainingDailyCredits || 3) / (stats.dailyLimit || 5)) * 100}
                  className="h-1.5 bg-gray-100"
                />
                <div className="absolute inset-0 h-1.5 bg-gradient-to-r from-green-400/20 to-green-600/20 rounded-full" style={{width: `${((stats.remainingDailyCredits || 3) / (stats.dailyLimit || 5)) * 100}%`}}></div>
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
