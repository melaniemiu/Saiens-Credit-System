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

        {/* Enhanced Game-style Skill Tree */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg p-8 overflow-x-auto min-h-[700px]">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 animate-pulse [animation-duration:8s]" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${6 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>
          
          <div className="relative z-10">
            {/* Tree structure */}
            <div className="flex flex-col items-center space-y-20">
              {jobLevels.map((level, levelIndex) => (
                <div key={level.name} className="relative w-full max-w-5xl pt-8 pb-8">
                  {/* Connection Line to Previous Level */}
                  {levelIndex > 0 && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-16">
                      <div className="w-1 h-16 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <ArrowRight className="h-4 w-4 text-white/50 rotate-90" />
                      </div>
                    </div>
                  )}

                  {/* Job Level Title with Enhanced Animation */}
                  <div className="text-center mb-12">
                    <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-xl shadow-2xl transform transition-all duration-500 hover:scale-105 ${
                      level.isCurrentLevel 
                        ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 ring-4 ring-blue-300 animate-pulse [animation-duration:4s] shadow-blue-500/50' 
                        : level.isCompleted 
                        ? 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 ring-4 ring-green-300 shadow-green-500/50'
                        : level.isLocked
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 opacity-50'
                        : 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 ring-4 ring-orange-300 shadow-orange-500/50'
                    }`}>
                      {level.isLocked ? (
                        <Lock className="h-7 w-7" />
                      ) : level.isCompleted ? (
                        <CheckCircle className="h-7 w-7 animate-bounce [animation-duration:2s]" />
                      ) : level.isCurrentLevel ? (
                        <Clock className="h-7 w-7 animate-spin [animation-duration:5s]" />
                      ) : (
                        <Play className="h-7 w-7" />
                      )}
                      <span className="tracking-wide">{level.name}</span>
                      
                      {/* Progress indicator */}
                      {!level.isLocked && level.skills.length > 0 && (
                        <div className="ml-2 flex items-center gap-1">
                          <span className="text-sm opacity-75">
                            {level.skills.filter(s => s.status === 'completed' && s.score && s.score >= 60).length}/{level.skills.length}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {level.isCurrentLevel && (
                      <div className="mt-3 animate-bounce [animation-duration:2s]">
                        <Badge className="bg-yellow-500 text-black font-bold text-sm px-3 py-1">
                          🎯 目前等級
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Skill Nodes with Connection Lines */}
                  {!level.isLocked && level.skills.length > 0 && (
                    <div className="relative">
                      {/* Connection lines between skills in the same level */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex: 1}}>
                        <defs>
                          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                          </linearGradient>
                        </defs>
                        {/* Horizontal connection lines */}
                        {level.skills.length > 1 && (
                          <line 
                            x1="20%" 
                            y1="50%" 
                            x2="80%" 
                            y2="50%" 
                            stroke="url(#connectionGradient)" 
                            strokeWidth="2"
                            className="animate-pulse [animation-duration:4s]"
                          />
                        )}
                      </svg>

                      {/* Skills arranged in enhanced tree pattern */}
                      <div className="relative z-10 grid grid-cols-3 gap-12 justify-items-center w-full mx-auto" style={{width: '540px'}}>
                        {level.skills
                          .sort((a, b) => a.Skill.name.localeCompare(b.Skill.name))
                          .map((skill, skillIndex) => {
                          const isCompleted = skill.status === 'completed' && skill.score && skill.score >= 60
                          const isInProgress = skill.status === 'in_progress' || (skill.status === 'completed' && (!skill.score || skill.score < 60))
                          const isLocked = skill.status === 'not_started'
                          
                          return (
                            <div
                              key={skill.id}
                              className="relative group flex flex-col items-center w-full transform transition-all duration-500 hover:scale-110 hover:-translate-y-2"
                              onClick={() => handleSkillClick(skill)}
                            >
                              {/* Skill Node with Enhanced Effects */}
                              <div className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all duration-500 ${
                                isCompleted
                                  ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-300 shadow-2xl shadow-yellow-500/60 hover:shadow-yellow-400/80'
                                  : isInProgress
                                  ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 border-blue-300 shadow-2xl shadow-blue-500/60 animate-pulse [animation-duration:3s] hover:shadow-blue-400/80'
                                  : 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 border-gray-500 opacity-70 hover:opacity-90 shadow-lg shadow-gray-500/30'
                              }`}>
                                {/* Glowing Ring Effect */}
                                {(isCompleted || isInProgress) && (
                                  <div className={`absolute inset-0 rounded-full border-2 ${
                                    isCompleted 
                                      ? 'border-yellow-300 animate-ping [animation-duration:3s]' 
                                      : 'border-blue-300 animate-ping [animation-duration:2s]'
                                  }`} />
                                )}
                                
                                {/* Skill Icon with Animation */}
                                <div className="text-white relative z-10">
                                  <Award className={`h-10 w-10 ${isCompleted ? 'animate-bounce [animation-duration:2s]' : ''}`} />
                                </div>
                                
                                {/* Enhanced Status Indicator */}
                                <div className="absolute -top-3 -right-3">
                                  {isCompleted && (
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce [animation-duration:2s]">
                                      <CheckCircle className="h-5 w-5 text-white" />
                                    </div>
                                  )}
                                  {isInProgress && (
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-spin [animation-duration:4s]">
                                      <Clock className="h-5 w-5 text-white" />
                                    </div>
                                  )}
                                  {isLocked && (
                                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                      <Lock className="h-5 w-5 text-white" />
                                    </div>
                                  )}
                                </div>

                                {/* Hover Particle Effect */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  {[...Array(8)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                                      style={{
                                        left: `${20 + Math.random() * 60}%`,
                                        top: `${20 + Math.random() * 60}%`,
                                        animationDelay: `${i * 0.1}s`,
                                        animationDuration: '1s'
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              {/* Enhanced Skill Name with Glow Effect */}
                              <div className="mt-4 text-center w-full">
                                <div className={`text-sm font-bold px-3 py-2 rounded-lg min-h-[3rem] flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:scale-105 ${
                                  isCompleted
                                    ? 'text-yellow-300 bg-yellow-900/40 shadow-lg shadow-yellow-900/50 border border-yellow-600/30'
                                    : isInProgress
                                    ? 'text-blue-300 bg-blue-900/40 shadow-lg shadow-blue-900/50 border border-blue-600/30'
                                    : 'text-gray-300 bg-gray-800/40 shadow-lg shadow-gray-800/50 border border-gray-600/30'
                                }`}>
                                  <span className="break-words text-center leading-tight">
                                    {skill.Skill.name}
                                  </span>
                                </div>
                                
                                {/* Enhanced Score Badge */}
                                <div className="mt-3 h-7 flex items-center justify-center">
                                  {skill.score && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-sm font-bold px-3 py-1 backdrop-blur-sm transition-all duration-300 ${
                                        skill.score >= 60 
                                          ? 'bg-green-900/50 text-green-300 border-green-400/50 shadow-lg shadow-green-900/50' 
                                          : 'bg-red-900/50 text-red-300 border-red-400/50 shadow-lg shadow-red-900/50'
                                      }`}
                                    >
                                      ⭐ {skill.score}分
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

                  {/* Enhanced Locked Level */}
                  {level.isLocked && (
                    <div className="text-center">
                      <div className="w-36 h-36 mx-auto bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-full flex items-center justify-center border-4 border-gray-600 opacity-50 transition-all duration-500 hover:opacity-70 hover:scale-105">
                        <Lock className="h-16 w-16 text-gray-400 animate-pulse [animation-duration:3s]" />
                      </div>
                      <div className="mt-6 text-gray-300 text-lg font-medium">
                        🔒 完成前一等級後解鎖
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom CSS for animations */}
          <style jsx>{`
            @keyframes float {
              0%, 100% {
                transform: translateY(0px) rotate(0deg);
                opacity: 0.3;
              }
              50% {
                transform: translateY(-20px) rotate(180deg);
                opacity: 0.7;
              }
            }
            .animate-float {
              animation: float 6s ease-in-out infinite;
            }
          `}</style>
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
                          <Award className="h-6 w-6" />
                        </div>
                      </div>
                      <div>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-left">
                          {selectedSkill.Skill.name}
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