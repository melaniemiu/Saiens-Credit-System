import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminCreditList } from "@/components/admin-credit-list"

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">管理員後台</h1>

      <Card>
        <CardHeader>
          <CardTitle>Credit 活動記錄</CardTitle>
          <CardDescription>所有員工的 Credit 收發記錄</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminCreditList />
        </CardContent>
      </Card>
    </div>
  )
}
