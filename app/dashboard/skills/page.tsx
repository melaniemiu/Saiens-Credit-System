"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SkillRoadmap } from "@/components/skill-roadmap"
import { Badge } from "@/components/ui/badge"
import { Map } from "lucide-react"

export default function SkillsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Map className="h-6 w-6 text-blue-600" />
            <CardTitle>技能路線圖</CardTitle>
          </div>
          <CardDescription>追蹤您的技能學習進度和發展路徑</CardDescription>
        </CardHeader>
      </Card>

      {/* 技能發展指南 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">技能發展指南</CardTitle>
          <CardDescription>了解技能標記與學習路徑</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                [必]
              </Badge>
              <div>
                <p className="font-medium text-gray-700">必修技能</p>
                <p className="text-gray-600">職位要求的核心技能，優先學習</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                [選]
              </Badge>
              <div>
                <p className="font-medium text-gray-700">選修技能</p>
                <p className="text-gray-600">進階提升，擴展專業能力範圍</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                已認證
              </Badge>
              <div>
                <p className="font-medium text-gray-700">完成技能</p>
                <p className="text-gray-600">已通過評估驗證的技能</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 技能路線圖 */}
      <SkillRoadmap />
    </div>
  )
}