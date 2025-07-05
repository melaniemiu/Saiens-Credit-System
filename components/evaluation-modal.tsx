"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Award, BookOpen, User, Calendar, Target, Star } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { skillApi } from "@/lib/api"

interface EvaluationRequest {
  userSkillId: string
  skillName: string
  userName: string
}

interface EvaluationData {
  skill: {
    id: string
    name: string
    category: string
    learningMethod: string
    assessmentMethod: string
    syllabus?: string
  }
  user: {
    id: string
    name: string
    employeeId: string
    email: string
    Department?: {
      name: string
    }
    Job?: {
      name: string
    }
  }
  userSkill: {
    id: string
    status: string
    startedAt: string
    completedAt: string
    certifiedAt?: string
    score?: number
    attempts: number
    notes?: string
  }
}

interface EvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  evaluationRequest: EvaluationRequest | null
}

export function EvaluationModal({ isOpen, onClose, evaluationRequest }: EvaluationModalProps) {
  const [score, setScore] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch evaluation data when modal opens
  useEffect(() => {
    if (isOpen && evaluationRequest?.userSkillId) {
      fetchEvaluationData()
    }
  }, [isOpen, evaluationRequest?.userSkillId])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setScore("")
      setFeedback("")
      setEvaluationData(null)
    }
  }, [isOpen])

  const fetchEvaluationData = async () => {
    if (!evaluationRequest?.userSkillId) return
    
    try {
      setIsLoading(true)
      const response = await skillApi.getEvaluationDetailsByUserSkillId(evaluationRequest.userSkillId)
      setEvaluationData(response.data)
    } catch (error) {
      console.error('Error fetching evaluation data:', error)
      toast({
        title: "載入失敗",
        description: "無法載入評估資料，請稍後再試",
        variant: "destructive",
      })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  if (!evaluationRequest) return null

  const handlePass = async () => {
    if (!score || parseInt(score) < 60) {
      toast({
        title: "分數不足",
        description: "通過評估需要分數至少 60 分",
        variant: "destructive",
      })
      return
    }

    if (parseInt(score) > 100) {
      toast({
        title: "分數無效",
        description: "分數不能超過 100 分",
        variant: "destructive",
      })
      return
    }

    await handleEvaluation("pass")
  }

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast({
        title: "請提供回饋",
        description: "拒絕評估時必須提供改進建議",
        variant: "destructive",
      })
      return
    }

    await handleEvaluation("reject")
  }

  const handleEvaluation = async (result: "pass" | "reject") => {
    if (!evaluationRequest?.userSkillId) return
    
    try {
      setIsSubmitting(true)
      
      const evaluationSubmissionData = {
        result,
        score: result === "pass" ? parseInt(score) : 0,
        feedback: feedback.trim(),
        evaluatedAt: new Date().toISOString()
      }

      await skillApi.submitEvaluationByUserSkillId(evaluationRequest.userSkillId, evaluationSubmissionData)
      
      toast({
        title: result === "pass" ? "評估通過" : "評估未通過",
        description: result === "pass" 
          ? `${evaluationRequest.userName} 的 "${evaluationRequest.skillName}" 技能評估已通過 (${score} 分)`
          : `${evaluationRequest.userName} 的 "${evaluationRequest.skillName}" 技能評估未通過，已提供改進建議`,
      })

      onClose()
      
    } catch (error) {
      console.error('Error submitting evaluation:', error)
      toast({
        title: "評估失敗",
        description: "提交評估結果時發生錯誤，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle>載入評估資料</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">載入評估資料中...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Show error state if no data
  if (!evaluationData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle>載入失敗</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-600">無法載入評估資料</p>
            <Button onClick={onClose} className="mt-4">關閉</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 shadow-soft-2xl rounded-lg max-h-[90vh]">
        <div className="overflow-y-auto max-h-[90vh]">
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-left">
                    技能評估申請
                  </DialogTitle>
                  <p className="text-gray-600 text-sm">
                    請評估學員的技能掌握程度
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Evaluation Request Info */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  評估資訊
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">申請學員</span>
                    <div className="font-medium">{evaluationData.user.name}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">申請技能</span>
                    <div className="font-medium">{evaluationData.skill.name}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">學員工號</span>
                    <div className="font-medium">{evaluationData.user.employeeId}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">技能類別</span>
                    <div className="font-medium">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {evaluationData.skill.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  技能詳情
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">學習方式</span>
                    <div className="mt-1">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {evaluationData.skill.learningMethod}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">評估方式</span>
                    <div className="mt-1">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {evaluationData.skill.assessmentMethod}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {evaluationData.skill.syllabus && (
                  <div>
                    <span className="text-sm text-gray-500">考試大綱</span>
                    <div className="mt-1 p-3 bg-gray-50 rounded text-sm leading-relaxed whitespace-pre-wrap">
                      {evaluationData.skill.syllabus}
                    </div>
                  </div>
                )}
              </div>

              {/* Learning Progress */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  學習進度
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {evaluationData.userSkill.startedAt && (
                    <div>
                      <span className="text-sm text-gray-500">開始學習</span>
                      <div className="font-medium">
                        {new Date(evaluationData.userSkill.startedAt).toLocaleDateString('zh-TW')}
                      </div>
                    </div>
                  )}
                  {evaluationData.userSkill.completedAt && (
                    <div>
                      <span className="text-sm text-gray-500">完成學習</span>
                      <div className="font-medium">
                        {new Date(evaluationData.userSkill.completedAt).toLocaleDateString('zh-TW')}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-500">嘗試次數</span>
                    <div className="font-medium">{evaluationData.userSkill.attempts} 次</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">目前狀態</span>
                    <div className="font-medium">
                      <Badge variant="outline">
                        {evaluationData.userSkill.status === 'completed' ? '等待評估' : 
                         evaluationData.userSkill.status === 'in_progress' ? '學習中' :
                         evaluationData.userSkill.status === 'certified' ? '已認證' : '未開始'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {evaluationData.userSkill.notes && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-500">學習筆記</span>
                    <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                      {evaluationData.userSkill.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Evaluation Form */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  評估結果
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="score" className="text-sm font-medium">
                      評估分數 (0-100)
                    </Label>
                    <Input
                      id="score"
                      type="number"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="請輸入評估分數 (60分以上為通過)"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      60 分以上為通過，未達 60 分視為未通過
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="feedback" className="text-sm font-medium">
                      評估回饋
                    </Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="請提供詳細的評估回饋，包括優點和改進建議..."
                      className="mt-1 min-h-[100px]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      請提供具體的回饋以幫助學員改進
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handlePass}
                  disabled={isSubmitting || !score}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                >
                  {isSubmitting ? (
                    "處理中..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      通過評估
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  {isSubmitting ? (
                    "處理中..."
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      未通過
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={onClose}
                  disabled={isSubmitting}
                  variant="ghost"
                  className="px-6"
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}