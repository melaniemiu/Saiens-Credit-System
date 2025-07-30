"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdvancedSkillTree } from "@/components/advanced-skill-tree"
import { Badge } from "@/components/ui/badge"
import { Award, BookOpen, CheckCircle, Clock, Play, Sparkles, Crown, Sword, Shield, Zap } from "lucide-react"

export default function SkillsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
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

      {/* 進階技能樹指南 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            進階技能樹指南
          </CardTitle>
          <CardDescription>了解新版技能樹的特色與操作方式</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Skill Categories */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">技能類別圖示</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-800">山恩DNA</p>
                    <p className="text-sm text-purple-600">企業文化與核心價值</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">產品知識</p>
                    <p className="text-sm text-blue-600">產品相關專業知識</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg">
                    <Sword className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">工具使用</p>
                    <p className="text-sm text-green-600">工具操作與應用技能</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-orange-800">安裝知識</p>
                    <p className="text-sm text-orange-600">安裝作業相關技能</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-red-800">安全操作</p>
                    <p className="text-sm text-red-600">安全規範與操作流程</p>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </CardContent>
      </Card>
    </div>
  )
}