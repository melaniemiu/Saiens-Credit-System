"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdvancedSkillTree } from "@/components/advanced-skill-tree"
import { Sparkles } from "lucide-react"

export default function SkillsPage() {
  return (
    <div className="w-full px-6 py-6 mx-auto">
      <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <CardTitle>進階技能樹系統</CardTitle>
          </div>
          <CardDescription>全新的互動式技能發展與學習路徑追蹤系統</CardDescription>
        </CardHeader>
      </Card>

        {/* 進階技能樹 */}
        <AdvancedSkillTree />

      </div>
    </div>
  )
}