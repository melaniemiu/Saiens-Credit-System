import { GiveCreditForm } from "@/components/give-credit-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GiveCreditPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>發送 Credit</CardTitle>
          <CardDescription>選擇同事並填寫表彰原因，每日可發送的次數有限</CardDescription>
        </CardHeader>
        <CardContent>
          <GiveCreditForm />
        </CardContent>
      </Card>
    </div>
  )
}
