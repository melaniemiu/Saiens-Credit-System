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
    <Card className="flex-1 border-none shadow-md bg-white">
      <CardHeader>
        <CardTitle>Credit 統計</CardTitle>
        <CardDescription>您的 Credit 數量與使用情況</CardDescription>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">目前 Credit</span>
                <span className="font-bold text-green-600">
                  {stats.creditsReceived - stats.creditsGiven || 50}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">已收到</span>
                <span>{stats.creditsReceived || 75}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">已送出</span>
                <span>{stats.creditsGiven || 25}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">今日剩餘可送出</span>
                <span>
                  {stats.remainingDailyCredits || 3} / {stats.dailyLimit || 5}
                </span>
              </div>
              <Progress
                value={((stats.remainingDailyCredits || 3) / (stats.dailyLimit || 5)) * 100}
                className="h-2"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">無法載入數據</div>
        )}
      </CardContent>
    </Card>
  )
}
