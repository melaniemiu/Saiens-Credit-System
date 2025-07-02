"use client"

import { SoftCard, SoftCardHeader, SoftCardContent, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { skillApi } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import { CheckCircle, Clock, Play, Award, ArrowRight, Lock, BookOpen, X, Calendar, User, Target } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface SkillProgress {
  id: string
  skillId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'certified'
  score?: number
  startedAt?: string
  completedAt?: string
  certifiedAt?: string
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

const getStatusIcon = (status: string, size = "h-4 w-4") => {
  switch (status) {
    case 'certified':
      return <Award className={`${size} text-yellow-500`} />
    case 'completed':
      return <CheckCircle className={`${size} text-green-500`} />
    case 'in_progress':
      return <Clock className={`${size} text-blue-500`} />
    default:
      return <Play className={`${size} text-gray-400`} />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'certified':
      return 'border-yellow-500 bg-yellow-50'
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

  useEffect(() => {
    const fetchRoadmapData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch user's skill progress
        const userSkillsResponse = await skillApi.getUserSkills()
        const userSkills = userSkillsResponse.data?.userSkills || []

        // Create a map of user progress by skill ID
        const progressMap: Record<string, SkillProgress> = {}
        userSkills.forEach((skill: SkillProgress) => {
          progressMap[skill.skillId] = skill
        })

        // Define job progression
        const jobProgression = ['新手村', '助理工程師', '正式工程師', '資深工程師']
        const currentUserJob = user?.Job?.name || ''
        const currentJobIndex = jobProgression.indexOf(currentUserJob)

        // Organize skills by job level using the jobLevel field from backend
        const skillsByJobLevel: Record<string, SkillProgress[]> = {}
        
        // Group skills by their job level
        userSkills.forEach((skill: SkillProgress) => {
          const jobLevel = skill.jobLevel || 'Unknown'
          if (!skillsByJobLevel[jobLevel]) {
            skillsByJobLevel[jobLevel] = []
          }
          skillsByJobLevel[jobLevel].push(skill)
        })

        // Create levels array based on job progression
        const levels: JobLevel[] = []
        
        for (let i = 0; i < jobProgression.length; i++) {
          const jobName = jobProgression[i]
          const skillsForLevel = skillsByJobLevel[jobName] || []

          // Calculate completion status
          const completedSkills = skillsForLevel.filter((skill: SkillProgress) => 
            skill.status === 'completed' || skill.status === 'certified'
          ).length
          const totalSkills = skillsForLevel.length
          const isCompleted = totalSkills > 0 && completedSkills === totalSkills
          const isCurrentLevel = i === currentJobIndex
          const isLocked = i > currentJobIndex + 1 // Can only see one level ahead

          levels.push({
            name: jobName,
            skills: skillsForLevel,
            isCompleted,
            isCurrentLevel,
            isLocked
          })
        }

        setJobLevels(levels)

      } catch (err) {
        console.error('Error fetching roadmap data:', err)
        setError('無法載入技能路線圖')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchRoadmapData()
    }
  }, [user])

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
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
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
                {jobLevels.reduce((sum, level) => sum + level.skills.filter(s => s.status === 'certified').length, 0)}
              </div>
              <div className="text-gray-500">已認證</div>
            </div>
            <div className="text-center">
              <div className="text-green-600 font-semibold">
                {jobLevels.reduce((sum, level) => sum + level.skills.filter(s => s.status === 'completed').length, 0)}
              </div>
              <div className="text-gray-500">已完成</div>
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
                          const isCompleted = skill.status === 'completed' || skill.status === 'certified'
                          const isInProgress = skill.status === 'in_progress'
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

                  {/* Vertical connection to next level */}
                  {levelIndex < jobLevels.length - 1 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4">
                      <svg width="20" height="75" viewBox="0 0 20 75" className="drop-shadow-lg">
                        <defs>
                          <linearGradient id={`vertical-gradient-${levelIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                            <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.8" />
                            <stop offset="70%" stopColor="#d97706" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#92400e" stopOpacity="0.4" />
                          </linearGradient>
                          <filter id={`vertical-glow-${levelIndex}`} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge> 
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                        </defs>
                        <path 
                          d="M 10 5 L 10 38 M 5 30 L 10 38 L 15 30" 
                          stroke={`url(#vertical-gradient-${levelIndex})`}
                          strokeWidth="4" 
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter={`url(#vertical-glow-${levelIndex})`}
                        >
                          <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite"/>
                        </path>
                        
                        {/* Additional glowing effects */}
                        <circle cx="10" cy="20" r="2" fill="#fbbf24" opacity="0.8">
                          <animate attributeName="r" values="1;3;1" dur="2s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SoftCardContent>

      {/* Skill Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-soft-2xl rounded-lg max-h-[80vh]">
          {selectedSkill && (
            <div className="overflow-y-auto max-h-[80vh]">
              <div className="p-6">
                <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                    selectedSkill.status === 'completed' || selectedSkill.status === 'certified'
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
                    {/* <DialogDescription className="text-gray-600">
                      {selectedSkill.Skill.category}
                    </DialogDescription> */}
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
                        {getStatusIcon(selectedSkill.status, "h-4 w-4")}
                        <span className="font-medium capitalize">
                          {selectedSkill.status === 'not_started' && '未開始'}
                          {selectedSkill.status === 'in_progress' && '學習中'}
                          {selectedSkill.status === 'completed' && '已完成'}
                          {selectedSkill.status === 'certified' && '已認證'}
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
                {(selectedSkill.startedAt || selectedSkill.completedAt || selectedSkill.certifiedAt) && (
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
                      {selectedSkill.certifiedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-500">認證時間:</span>
                          <span className="font-medium">
                            {new Date(selectedSkill.certifiedAt).toLocaleDateString('zh-TW')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SoftCard>
  )
}