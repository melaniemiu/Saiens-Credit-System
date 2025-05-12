import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RecentCredits() {
  // Mock credit data - in a real implementation, this would come from a database
  const recentCredits = [
    {
      id: 1,
      type: "received",
      from: "李大華",
      to: "王小明",
      reason: "協助解決系統問題，快速且有效率",
      timestamp: "2023-06-15T09:30:00",
    },
    {
      id: 2,
      type: "given",
      from: "王小明",
      to: "張美玲",
      reason: "主動協助新進同仁適應工作環境",
      timestamp: "2023-06-14T14:45:00",
    },
    {
      id: 3,
      type: "received",
      from: "陳志明",
      to: "王小明",
      reason: "在專案中提供創新解決方案",
      timestamp: "2023-06-12T11:20:00",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近 Credit 活動</CardTitle>
        <CardDescription>您最近的 Credit 收發記錄</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentCredits.map((credit) => (
            <div key={credit.id} className="flex items-start space-x-4 rounded-lg border p-4">
              <Badge variant={credit.type === "received" ? "default" : "outline"} className="mt-1">
                {credit.type === "received" ? "收到" : "送出"}
              </Badge>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  {credit.type === "received" ? (
                    <>
                      <span className="font-semibold">{credit.from}</span> 給了您 Credit
                    </>
                  ) : (
                    <>
                      您給了 <span className="font-semibold">{credit.to}</span> Credit
                    </>
                  )}
                </p>
                <p className="text-sm text-gray-500">"{credit.reason}"</p>
                <p className="text-xs text-gray-400">{new Date(credit.timestamp).toLocaleString("zh-TW")}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
