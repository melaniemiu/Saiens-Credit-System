"use client"

import { SoftCard, SoftCardHeader, SoftCardContent, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { skillApi } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import { CheckCircle, Clock, Play, Award, ArrowRight, Lock } from "lucide-react"

interface SkillProgress {
  id: string
  skillId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'certified'
  score?: number
  completedAt?: string
  certifiedAt?: string
  jobLevel?: string
  Skill: {
    id: string
    name: string
    category: string
    isRequired: boolean
    learningMethod: string
    assessmentMethod: string
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
        <div className="space-y-6">
          {jobLevels.map((level, index) => (
            <div key={level.name} className="relative">
              {/* Job Level Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
                  level.isCurrentLevel 
                    ? 'border-blue-500 bg-blue-50' 
                    : level.isCompleted 
                    ? 'border-green-500 bg-green-50'
                    : level.isLocked
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-orange-500 bg-orange-50'
                }`}>
                  {level.isLocked ? (
                    <Lock className="h-5 w-5 text-gray-400" />
                  ) : level.isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : level.isCurrentLevel ? (
                    <Clock className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Play className="h-5 w-5 text-orange-500" />
                  )}
                  <span className="font-semibold text-sm">{level.name}</span>
                </div>
                
                {level.isCurrentLevel && (
                  <Badge variant="secondary" className="text-xs">
                    目前等級
                  </Badge>
                )}
              </div>

              {/* Skills Summary */}
              {!level.isLocked && (
                <div className="ml-6 mb-4">
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                    <span>技能總數: {level.skills.length}</span>
                    <span className="text-green-600">
                      已完成: {level.skills.filter(s => s.status === 'completed' || s.status === 'certified').length}
                    </span>
                    <span className="text-blue-600">
                      學習中: {level.skills.filter(s => s.status === 'in_progress').length}
                    </span>
                  </div>
                  
                  {/* Skills Grid - Show sample skills */}
                  {level.skills.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                      {level.skills.slice(0, 3).map((skill) => (
                        <div
                          key={skill.id}
                          className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${getStatusColor(skill.status)}`}
                          title={`${skill.Skill.name}\n狀態: ${skill.status}\n類別: ${skill.Skill.category}\n學習方式: ${skill.Skill.learningMethod}\n評估方式: ${skill.Skill.assessmentMethod}`}
                        >
                          {getStatusIcon(skill.status, "h-3 w-3")}
                          <span className="truncate flex-1">{skill.Skill.name}</span>
                          {skill.score && (
                            <Badge variant="outline" className="text-xs">
                              {skill.score}分
                            </Badge>
                          )}
                        </div>
                      ))}
                      {level.skills.length > 3 && (
                        <div className="p-2 rounded-lg border border-gray-200 bg-gray-50 text-xs flex items-center justify-center text-gray-500">
                          +{level.skills.length - 3} 個技能...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Locked Level Message */}
              {level.isLocked && (
                <div className="ml-6 text-xs text-gray-500 italic">
                  完成前一等級後解鎖
                </div>
              )}

              {/* Arrow to next level */}
              {index < jobLevels.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
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
      </SoftCardContent>
    </SoftCard>
  )
}