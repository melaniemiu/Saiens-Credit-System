"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SkillRoadmap } from "@/components/skill-roadmap"
import { Badge } from "@/components/ui/badge"
import { Map, Award, BookOpen, CheckCircle, Clock, Play } from "lucide-react"

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

      {/* 技能路線圖 */}
      <SkillRoadmap />

      {/* 技能發展指南 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">技能發展指南</CardTitle>
          <CardDescription>了解技能圖示與學習狀態</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Job Requirement Icons */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">職位需求圖示</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-yellow-300 bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    {/* Required badge */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">必</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-red-800">職位必修技能</p>
                    <p className="text-sm text-red-600">此職位要求的核心技能，優先學習</p>
                    <p className="text-xs text-gray-500 mt-1">顯示為金色圓圈 + 紅色「必」標記</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-12 h-12 rounded-full border-2 border-yellow-300 bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">職位選修技能</p>
                    <p className="text-sm text-blue-600">此職位的進階技能，擴展專業能力</p>
                    <p className="text-xs text-gray-500 mt-1">顯示為金色圓圈（無標記）</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Icons */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">學習狀態圖示</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-yellow-300 bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-yellow-800">已認證</p>
                    <p className="text-sm text-yellow-600">完成並通過評估</p>
                    <p className="text-xs text-gray-500 mt-1">金色圓圈 + 綠色勾選標記</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-300 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50 animate-pulse [animation-duration:3s]">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">學習中</p>
                    <p className="text-sm text-blue-600">正在進行學習</p>
                    <p className="text-xs text-gray-500 mt-1">藍色圓圈 + 時鐘標記 + 呼吸燈效果</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 rounded-full border-4 border-gray-500 bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center opacity-60">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">未開始</p>
                    <p className="text-sm text-gray-600">尚未開始學習</p>
                    <p className="text-xs text-gray-500 mt-1">灰色圓圈 + 半透明效果</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <h4 className="font-medium text-gray-800 mb-2">💡 使用提示</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 點擊技能節點可查看詳細資訊</li>
                <li>• 職位必修技能會優先顯示在前面</li>
                <li>• 學習中的技能會有呼吸燈效果</li>
                <li>• 完成前一等級後可解鎖下一等級</li>
                <li>• 技能的必修/選修狀態依職位而定</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}