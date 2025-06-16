import { CreditHistory } from "@/components/credit-history"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Credit 歷程</CardTitle>
          <CardDescription>查看您的 Credit 表彰記錄</CardDescription>
        </CardHeader>
        <CardContent>
          <CreditHistory />
        </CardContent>
      </Card>
    </div>
  )
}
