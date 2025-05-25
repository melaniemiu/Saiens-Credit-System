"use client"

import { SoftCard, SoftCardHeader, SoftCardContent, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { skillApi, userApi } from "@/lib/api"
import { useEffect, useState } from "react"
import { CheckCircle, Clock, Play, Award } from "lucide-react"

interface SkillData {
  id: string
  name: string
  category: string
  isRequired: boolean
  learningMethod: string
  assessmentMethod: string
  jobLevel?: string
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed' | 'certified'
    score?: number
    completedAt?: string
    certifiedAt?: string
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'certified':
      return <Award className="h-4 w-4 text-yellow-500" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-500" />
    default:
      return <Play className="h-4 w-4 text-gray-400" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'certified':
      return 'bg-gradient-warning'
    case 'completed':
      return 'bg-gradient-success'
    case 'in_progress':
      return 'bg-gradient-info'
    default:
      return 'bg-gray-400'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'certified':
      return '已認證'
    case 'completed':
      return '已完成'
    case 'in_progress':
      return '學習中'
    default:
      return '未開始'
  }
}

export function SkillProgressCard() {
  const [skillsData, setSkillsData] = useState<SkillData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    total: number
    completed: number
    completionPercentage: number
  } | null>(null)
  const [skillsByLevel, setSkillsByLevel] = useState<Record<string, SkillData[]>>({})
  const [currentJobLevel, setCurrentJobLevel] = useState<string | null>(null)

  useEffect(() => {
    const fetchSkillData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch current user to get job level
        const userResponse = await userApi.getCurrentUser()
        const currentUser = userResponse.data?.user
        const userJobLevel = currentUser?.Job?.name || null
        setCurrentJobLevel(userJobLevel)
        
        // Fetch user's skill progress with job level info
        const userSkillsResponse = await skillApi.getUserSkills()
        if (userSkillsResponse.data?.userSkills) {
          // Transform and organize by job level
          const transformedSkills = userSkillsResponse.data.userSkills.map((item: any) => ({
            id: item.Skill.id,
            name: item.Skill.name,
            category: item.Skill.category,
            isRequired: item.Skill.isRequired,
            learningMethod: item.Skill.learningMethod,
            assessmentMethod: item.Skill.assessmentMethod,
            jobLevel: item.jobLevel,
            progress: {
              status: item.status,
              score: item.score,
              completedAt: item.completedAt,
              certifiedAt: item.certifiedAt,
            }
          }))
          
          setSkillsData(transformedSkills)

          // Group skills by job level
          const grouped = transformedSkills.reduce((acc: Record<string, SkillData[]>, skill) => {
            const level = skill.jobLevel || 'Unknown'
            if (!acc[level]) acc[level] = []
            acc[level].push(skill)
            return acc
          }, {})
          setSkillsByLevel(grouped)
        }

        // Fetch skill statistics
        const statsResponse = await skillApi.getSkillStats()
        if (statsResponse.data) {
          setStats({
            total: statsResponse.data.total,
            completed: statsResponse.data.completed,
            completionPercentage: statsResponse.data.completionPercentage
          })
        }

      } catch (err) {
        console.error('Error fetching skill data:', err)
        setError('無法載入技能資料')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSkillData()
  }, [])

  if (isLoading) {
    return (
      <SoftCard>
        <SoftCardHeader>
          <SoftCardTitle>技能進度</SoftCardTitle>
          <SoftCardDescription>您的技能學習進度</SoftCardDescription>
        </SoftCardHeader>
        <SoftCardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </SoftCardContent>
      </SoftCard>
    )
  }

  if (error) {
    return (
      <SoftCard>
        <SoftCardHeader>
          <SoftCardTitle>技能進度</SoftCardTitle>
          <SoftCardDescription className="text-red-500">{error}</SoftCardDescription>
        </SoftCardHeader>
      </SoftCard>
    )
  }

  // Show latest certified skills from current job level only
  console.log(skillsData)
  const latestCertifiedSkills = skillsData
    .filter(skill => 
      skill.progress?.status === 'completed' && 
      skill.jobLevel === currentJobLevel
    )
    .sort((a, b) => {
      const dateA = a.progress?.certifiedAt || a.progress?.completedAt || '1970-01-01'
      const dateB = b.progress?.certifiedAt || b.progress?.completedAt || '1970-01-01'
      return new Date(dateB).getTime() - new Date(dateA).getTime() // Latest first
    })
    .slice(0, 4)

  console.log(latestCertifiedSkills)
  return (
    <SoftCard>
      <SoftCardHeader>
        <SoftCardTitle>技能進度</SoftCardTitle>
        <SoftCardDescription>您的技能學習進度</SoftCardDescription>
        {stats && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>完成進度</span>
              <span>{stats.completed}/{stats.total} ({stats.completionPercentage}%)</span>
            </div>
            <Progress value={stats.completionPercentage} className="h-2" />
          </div>
        )}
      </SoftCardHeader>
      <SoftCardContent>
        {latestCertifiedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {latestCertifiedSkills.map((skill) => (
              <div
                key={skill.id}
                className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-200 shadow-sm hover:bg-yellow-200 transition-colors"
                title={`已認證: ${skill.name}\n職位層級: ${skill.jobLevel}\n認證時間: ${skill.progress?.certifiedAt ? new Date(skill.progress.certifiedAt).toLocaleDateString() : '未知'}`}
              >
                <Award className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <span className="break-words">{skill.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            尚未獲得任何技能認證
          </div>
        )}
        
        {skillsData.filter(s => s.progress?.status === 'certified' && s.jobLevel === currentJobLevel).length > 4 && (
          <div className="mt-3 text-center">
            <Badge variant="secondary" className="text-xs">
              目前職位已認證 {skillsData.filter(s => s.progress?.status === 'certified' && s.jobLevel === currentJobLevel).length} 個技能
            </Badge>
          </div>
        )}
      </SoftCardContent>
    </SoftCard>
  )
}