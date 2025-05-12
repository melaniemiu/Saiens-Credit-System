import { GiveCreditForm } from "@/components/give-credit-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GiveCreditPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>給予 Credit</CardTitle>
          <CardDescription>選擇同事並填寫表彰原因，每日可給予的次數有限</CardDescription>
        </CardHeader>
        <CardContent>
          <GiveCreditForm />
        </CardContent>
      </Card>
    </div>
  )
}
