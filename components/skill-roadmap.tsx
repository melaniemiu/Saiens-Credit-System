"use client"

import { SoftCard, SoftCardHeader, SoftCardContent, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { CheckCircle, Clock, Play, Award, ArrowRight, Lock, BookOpen, X, Calendar, User, Target } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface SkillProgress {
  id: string
  skillId: string
  status: 'not_started' | 'in_progress' | 'completed'
  score?: number
  startedAt?: string
  completedAt?: string
  evaluatedAt?: string
  evaluationRequestedAt?: string
  attempts?: number
  jobLevel?: string
  Skill: {
    id: string
    name: string
    category: string
    isRequired: boolean
    learningMethod: string
    assessmentMethod: string
    syllabus?: string
  }
}

interface JobLevel {
  name: string
  skills: SkillProgress[]
  isCompleted: boolean
  isCurrentLevel: boolean
  isLocked: boolean
}

const getStatusIcon = (status: string, score?: number, size = "h-4 w-4") => {
  if (status === 'completed' && score && score >= 60) {
    return <Award className={`${size} text-yellow-500`} />
  }
  switch (status) {
    case 'completed':
      return <CheckCircle className={`${size} text-green-500`} />
    case 'in_progress':
      return <Clock className={`${size} text-blue-500`} />
    default:
      return <Play className={`${size} text-gray-400`} />
  }
}

const getStatusColor = (status: string, score?: number) => {
  if (status === 'completed' && score && score >= 60) {
    return 'border-yellow-500 bg-yellow-50'
  }
  switch (status) {
    case 'completed':
      return 'border-green-500 bg-green-50'
    case 'in_progress':
      return 'border-blue-500 bg-blue-50'
    default:
      return 'border-gray-300 bg-gray-50'
  }
}

export function SkillRoadmap() {
  const { user } = useAuth()
  const [jobLevels, setJobLevels] = useState<JobLevel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillProgress | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSkillClick = (skill: SkillProgress) => {
    setSelectedSkill(skill)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSkill(null)
  }

  const fetchRoadmapData = async () => {
    try {
      setIsLoading(true)
      
      // Get department-based job progression with skill progress
      const progressionResponse = await apiClient.getDepartmentProgression()
      const { department, currentJob, jobProgression } = progressionResponse.data || {}

      // Debug logging
      console.log('🔍 [ROADMAP] Department:', department)
      console.log('🔍 [ROADMAP] Current job:', currentJob)
      console.log('🔍 [ROADMAP] Job progression:', jobProgression)

      // Create levels array based on department job progression
      const levels: JobLevel[] = []
      
      jobProgression?.forEach((job: any) => {
        const skillsForLevel = job.skillsWithProgress?.map((jobSkill: any) => ({
          id: jobSkill.userProgress?.id || `${jobSkill.skillId}-${Date.now()}`,
          skillId: jobSkill.skillId,
          status: jobSkill.userProgress?.status || 'not_started',
          score: jobSkill.userProgress?.score,
          startedAt: jobSkill.userProgress?.startedAt,
          completedAt: jobSkill.userProgress?.completedAt,
          evaluatedAt: jobSkill.userProgress?.evaluatedAt,
          evaluationRequestedAt: jobSkill.userProgress?.evaluationRequestedAt,
          attempts: jobSkill.userProgress?.attempts || 0,
          jobLevel: job.name,
          Skill: {
            id: jobSkill.Skill.id,
            name: jobSkill.Skill.name,
            category: jobSkill.Skill.category,
            isRequired: jobSkill.isRequired,
            learningMethod: jobSkill.Skill.learningMethod,
            assessmentMethod: jobSkill.Skill.assessmentMethod,
            syllabus: jobSkill.Skill.syllabus,
          }
        })) || []

        // Calculate completion status
        const completedSkills = skillsForLevel.filter((skill: SkillProgress) => 
          skill.status === 'completed' && skill.score && skill.score >= 60
        ).length
        const totalSkills = skillsForLevel.length
        const isCompleted = totalSkills > 0 && completedSkills === totalSkills

        levels.push({
          name: job.name,
          skills: skillsForLevel,
          isCompleted,
          isCurrentLevel: job.isCurrentJob,
          isLocked: false, // Show all job levels in department
        })
      })

      // Sort levels by job level (ascending)
      levels.sort((a, b) => {
        const aJob = jobProgression?.find((j: any) => j.name === a.name)
        const bJob = jobProgression?.find((j: any) => j.name === b.name)
        return (aJob?.level || 0) - (bJob?.level || 0)
      })

      // Debug logging for final result
      console.log('🔍 [ROADMAP] Final levels:', levels.map(l => ({ name: l.name, skillCount: l.skills.length, isCurrentLevel: l.isCurrentLevel })))

      setJobLevels(levels)
      setError(null)
    } catch (error) {
      console.error('Error fetching roadmap data:', error)
      setError('載入技能路線圖失敗，請稍後重試')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartEvaluation = async (skill: SkillProgress) => {
    try {
      await apiClient.requestEvaluation(skill.skillId)
      toast({
        title: "評估申請已送出",
        description: `已為技能「${skill.Skill.name}」申請評估，評估員將收到通知。`,
      })
      setIsModalOpen(false)
      await fetchRoadmapData()
    } catch (error) {
      console.error('Error requesting evaluation:', error)
      toast({
        title: "申請失敗",
        description: "評估申請失敗，請稍後再試。",
        variant: "destructive",
      })
    }
  }

  const handleStartLearning = async (skill: SkillProgress) => {
    try {
      // Update skill status to in_progress
      await apiClient.updateSkillProgress(skill.skillId, { 
        status: 'in_progress',
        startedAt: new Date().toISOString()
      })
      
      toast({
        title: "開始學習",
        description: `已開始學習技能「${skill.Skill.name}」`,
      })
      
      // Close modal
      setIsModalOpen(false)
      
      // Refresh data to show updated status
      await fetchRoadmapData()
      
    } catch (error) {
      console.error('Error starting learning:', error)
      toast({
        title: "操作失敗",
        description: "開始學習失敗，請稍後再試。",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (user) {
      fetchRoadmapData()
    }
  }, [user])

  // Listen for evaluation completion events to refresh roadmap
  useEffect(() => {
    const handleRefreshRoadmap = (event: CustomEvent) => {
      console.log('🔄 [ROADMAP] Refreshing roadmap due to evaluation completion:', event.detail)
      fetchRoadmapDataWithCacheBust()
    }

    window.addEventListener('refreshSkillRoadmap', handleRefreshRoadmap as EventListener)
    
    return () => {
      window.removeEventListener('refreshSkillRoadmap', handleRefreshRoadmap as EventListener)
    }
  }, [])

  const fetchRoadmapDataWithCacheBust = async () => {
    console.log('🔍 [ROADMAP] Cache bust requested, waiting briefly then calling regular fetch')
    
    // Add a small delay to ensure backend changes are committed
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Call the regular fetch which handles all the logic properly
    return fetchRoadmapData()
  }

  if (isLoading) {
    return (
      <SoftCard>
        <SoftCardHeader>
          <SoftCardTitle>技能路線圖</SoftCardTitle>
          <SoftCardDescription>您的職業發展路徑</SoftCardDescription>
        </SoftCardHeader>
        <SoftCardContent>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-32" />
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-20 w-20 rounded-full mx-auto" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SoftCardContent>
      </SoftCard>
    )
  }

  if (error) {
    return (
      <SoftCard>
        <SoftCardHeader>
          <SoftCardTitle>技能路線圖</SoftCardTitle>
          <SoftCardDescription className="text-red-500">{error}</SoftCardDescription>
        </SoftCardHeader>
      </SoftCard>
    )
  }

  return (
    <SoftCard>
      <SoftCardHeader>
        <SoftCardTitle>技能路線圖</SoftCardTitle>
        <SoftCardDescription>您的職業發展路徑與技能進度</SoftCardDescription>
        <div className="mt-2">
          <Badge variant={user?.Job?.name ? "default" : "secondary"} className="text-xs">
            目前職位: {user?.Job?.name || '未設定'}
          </Badge>
        </div>
      </SoftCardHeader>
      <SoftCardContent>
        {/* Progress Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">進度總覽</div>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="text-center">
              <div className="text-yellow-600 font-semibold">
                {jobLevels.reduce((sum, level) => sum + level.skills.filter(s => s.status === 'completed' && s.score && s.score >= 60).length, 0)}
              </div>
              <div className="text-gray-500">已通過</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-semibold">
                {jobLevels.reduce((sum, level) => sum + level.skills.filter(s => s.status === 'completed' && (!s.score || s.score < 60)).length, 0)}
              </div>
              <div className="text-gray-500">等待評估</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-semibold">
                {jobLevels.reduce((sum, level) => sum + level.skills.filter(s => s.status === 'in_progress').length, 0)}
              </div>
              <div className="text-gray-500">學習中</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 font-semibold">
                {jobLevels.reduce((sum, level) => sum + level.skills.filter(s => s.status === 'not_started').length, 0)}
              </div>
              <div className="text-gray-500">未開始</div>
            </div>
          </div>
        </div>

        {/* Game-style Skill Tree */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 overflow-x-auto min-h-[600px]">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          <div className="relative z-10">
            {/* Tree structure */}
            <div className="flex flex-col items-center space-y-16">
              {jobLevels.map((level, levelIndex) => (
                <div key={level.name} className="relative w-full max-w-5xl pt-8 pb-8">
                  {/* Job Level Title */}
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-white font-bold text-lg shadow-2xl ${
                      level.isCurrentLevel 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 ring-4 ring-blue-300' 
                        : level.isCompleted 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 ring-4 ring-green-300'
                        : level.isLocked
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 ring-4 ring-orange-300'
                    }`}>
                      {level.isLocked ? (
                        <Lock className="h-6 w-6" />
                      ) : level.isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : level.isCurrentLevel ? (
                        <Clock className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                      <span>{level.name}</span>
                    </div>
                    
                    {level.isCurrentLevel && (
                      <div className="mt-2">
                        <Badge className="bg-yellow-500 text-black font-bold">
                          目前等級
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Skill Nodes */}
                  {!level.isLocked && level.skills.length > 0 && (
                    <div className="relative">
                      {/* Skills arranged in a tree pattern - fixed 3 columns with proper alignment */}
                      <div className="grid grid-cols-3 gap-8 justify-items-center w-full mx-auto" style={{width: '480px'}}>
                        {level.skills
                          .sort((a, b) => {
                            // Sort by required status first (必修 first, then 選修)
                            if (a.Skill.isRequired && !b.Skill.isRequired) return -1
                            if (!a.Skill.isRequired && b.Skill.isRequired) return 1
                            return a.Skill.name.localeCompare(b.Skill.name) // Then by name
                          })
                          .map((skill, skillIndex) => {
                          const isCompleted = skill.status === 'completed' && skill.score && skill.score >= 60
                          const isInProgress = skill.status === 'in_progress' || (skill.status === 'completed' && (!skill.score || skill.score < 60))
                          const isLocked = skill.status === 'not_started'
                          
                          return (
                            <div
                              key={skill.id}
                              className="relative group flex flex-col items-center w-full"
                              onClick={() => handleSkillClick(skill)}
                            >
                              {/* Skill Node */}
                              <div className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 ${
                                isCompleted
                                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300 shadow-lg shadow-yellow-500/50'
                                  : isInProgress
                                  ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-300 shadow-lg shadow-blue-500/50 animate-pulse [animation-duration:3s]'
                                  : 'bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500 opacity-60'
                              }`}>
                                {/* Skill Icon */}
                                <div className="text-white">
                                  {skill.Skill.isRequired ? (
                                    <Award className="h-8 w-8" />
                                  ) : (
                                    <BookOpen className="h-8 w-8" />
                                  )}
                                </div>
                                
                                {/* Status indicator */}
                                <div className="absolute -top-2 -right-2">
                                  {isCompleted && (
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                  {isInProgress && (
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <Clock className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                  {skill.Skill.isRequired && (
                                    <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">必</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Skill Name */}
                              <div className="mt-3 text-center w-full">
                                <div className={`text-xs font-medium px-2 py-1 rounded min-h-[2.5rem] flex items-center justify-center ${
                                  isCompleted
                                    ? 'text-yellow-300 bg-yellow-900/30'
                                    : isInProgress
                                    ? 'text-blue-300 bg-blue-900/30'
                                    : 'text-gray-400 bg-gray-800/30'
                                }`}>
                                  <span className="break-words text-center leading-tight">
                                    {skill.Skill.name}
                                  </span>
                                </div>
                                
                                {/* Score */}
                                <div className="mt-2 h-6 flex items-center justify-center">
                                  {skill.score && (
                                    <Badge variant="outline" className="text-xs bg-black/30 text-white border-white/30">
                                      {skill.score}分
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Locked Level */}
                  {level.isLocked && (
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center border-4 border-gray-600 opacity-50">
                        <Lock className="h-12 w-12 text-gray-400" />
                      </div>
                      <div className="mt-4 text-gray-400 text-sm">
                        完成前一等級後解鎖
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Detail Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-soft-2xl rounded-lg max-h-[80vh]">
            {selectedSkill && (
              <div className="overflow-y-auto max-h-[80vh]">
                <div className="p-6">
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                        selectedSkill.status === 'completed' && selectedSkill.score && selectedSkill.score >= 60
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300'
                          : selectedSkill.status === 'in_progress'
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-300'
                          : 'bg-gradient-to-br from-gray-400 to-gray-600 border-gray-300'
                      }`}>
                        <div className="text-white">
                          {selectedSkill.Skill.isRequired ? (
                            <Award className="h-6 w-6" />
                          ) : (
                            <BookOpen className="h-6 w-6" />
                          )}
                        </div>
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-left">
                          {selectedSkill.Skill.name}
                          {selectedSkill.Skill.isRequired && (
                            <Badge className="bg-red-500 text-white">必</Badge>
                          )}
                          {!selectedSkill.Skill.isRequired && (
                            <Badge className="bg-blue-500 text-white">選</Badge>
                          )}
                        </DialogTitle>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 mt-6">
                    {/* Status Section */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        學習狀態
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">目前狀態</span>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(selectedSkill.status, selectedSkill.score, "h-4 w-4")}
                            <span className="font-medium capitalize">
                              {selectedSkill.status === 'not_started' && '未開始'}
                              {selectedSkill.status === 'in_progress' && selectedSkill.evaluationRequestedAt && !selectedSkill.evaluatedAt && '評估申請中'}
                              {selectedSkill.status === 'in_progress' && !selectedSkill.evaluationRequestedAt && '學習中'}
                              {selectedSkill.status === 'completed' && selectedSkill.score && selectedSkill.score >= 60 && '已通過'}
                              {selectedSkill.status === 'completed' && selectedSkill.evaluationRequestedAt && !selectedSkill.evaluatedAt && '評估申請中'}
                              {selectedSkill.status === 'completed' && (!selectedSkill.score || selectedSkill.score < 60) && !selectedSkill.evaluationRequestedAt && '等待評估'}
                            </span>
                          </div>
                        </div>
                        {selectedSkill.score && selectedSkill.score > 0 && (
                          <div>
                            <span className="text-sm text-gray-500">評估分數</span>
                            <div className="mt-1">
                              <Badge variant="outline" className="font-bold">
                                {selectedSkill.score} 分
                              </Badge>
                            </div>
                          </div>
                        )}
                        {selectedSkill.attempts > 0 && (
                          <div>
                            <span className="text-sm text-gray-500">嘗試次數</span>
                            <div className="mt-1">
                              <span className="font-medium">{selectedSkill.attempts} 次</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Learning Details */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        學習詳情
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">學習方式</span>
                          <div className="mt-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {selectedSkill.Skill.learningMethod}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">評估方式</span>
                          <div className="mt-1">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {selectedSkill.Skill.assessmentMethod}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Syllabus Section */}
                    {selectedSkill.Skill.syllabus && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          考試大綱
                        </h3>
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {selectedSkill.Skill.syllabus}
                        </div>
                      </div>
                    )}

                    {/* Progress Timeline */}
                    {(selectedSkill.startedAt || selectedSkill.completedAt || selectedSkill.evaluationRequestedAt || selectedSkill.evaluatedAt) && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          學習時程
                        </h3>
                        <div className="space-y-2">
                          {selectedSkill.startedAt && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-gray-500">開始時間:</span>
                              <span className="font-medium">
                                {new Date(selectedSkill.startedAt).toLocaleDateString('zh-TW')}
                              </span>
                            </div>
                          )}
                          {selectedSkill.completedAt && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-gray-500">完成時間:</span>
                              <span className="font-medium">
                                {new Date(selectedSkill.completedAt).toLocaleDateString('zh-TW')}
                              </span>
                            </div>
                          )}
                          {selectedSkill.evaluationRequestedAt && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-gray-500">申請評估:</span>
                              <span className="font-medium">
                                {new Date(selectedSkill.evaluationRequestedAt).toLocaleDateString('zh-TW')}
                              </span>
                            </div>
                          )}
                          {selectedSkill.evaluatedAt && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-gray-500">評估時間:</span>
                              <span className="font-medium">
                                {new Date(selectedSkill.evaluatedAt).toLocaleDateString('zh-TW')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Evaluation Result Section */}
                    {selectedSkill.evaluatedAt && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          評估結果
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">結果:</span>
                            <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                              selectedSkill.status === 'completed' && selectedSkill.score >= 60
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {selectedSkill.status === 'completed' && selectedSkill.score >= 60 ? '通過' : '未通過'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            評估時間: {new Date(selectedSkill.evaluatedAt).toLocaleString('zh-TW')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex gap-3">
                      {/* Start Evaluation Button - Show when skill is ready for evaluation and not currently pending */}
                      {((selectedSkill.status === 'completed' && (!selectedSkill.score || selectedSkill.score < 60)) || selectedSkill.status === 'in_progress') && 
                       (!selectedSkill.evaluationRequestedAt || (selectedSkill.evaluationRequestedAt && selectedSkill.evaluatedAt && selectedSkill.evaluatedAt >= selectedSkill.evaluationRequestedAt)) && (
                        <button
                          onClick={() => handleStartEvaluation(selectedSkill)}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <Award className="h-4 w-4" />
                          申請評估
                        </button>
                      )}
                      
                      {/* Start Learning Button */}
                      {selectedSkill.status === 'not_started' && (
                        <button
                          onClick={() => handleStartLearning(selectedSkill)}
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <BookOpen className="h-4 w-4" />
                          開始學習
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SoftCardContent>
    </SoftCard>
  )
}