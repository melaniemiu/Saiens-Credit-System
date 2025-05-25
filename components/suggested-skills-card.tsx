"use client"

import { SoftCard, SoftCardHeader, SoftCardContent, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { skillApi } from "@/lib/api"
import { useEffect, useState } from "react"
import { BookOpen, Target } from "lucide-react"

interface SuggestedSkill {
  id: string
  skillId: string
  Skill: {
    id: string
    name: string
    category: string
    isRequired: boolean
    learningMethod: string
    assessmentMethod: string
  }
}

export function SuggestedSkillsCard() {
  const [suggestedSkills, setSuggestedSkills] = useState<SuggestedSkill[]>([])
  const [currentJob, setCurrentJob] = useState<{ name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSuggestedSkills = async () => {
      try {
        setIsLoading(true)
        
        // Get user's current skills with job level info
        const userSkillsResponse = await skillApi.getUserSkills()
        const userSkills = userSkillsResponse.data?.userSkills || []
        
        // Get skills for user's current job level
        const jobSkillsResponse = await skillApi.getJobSkills()
        const jobSkillsData = jobSkillsResponse.data?.skillsWithProgress || []
        
        // Find unlearned skills from current job level
        const unlearnedSkills = jobSkillsData
          .filter(jobSkill => {
            // Find if user has progress on this skill
            const userProgress = userSkills.find(us => us.skillId === jobSkill.Skill.id)
            // Show skills that are not started or in progress (not completed/certified)
            return !userProgress || userProgress.status === 'not_started' || userProgress.status === 'in_progress'
          })
          .slice(0, 4) // Limit to 4 suggestions
        
        setSuggestedSkills(unlearnedSkills)
        setCurrentJob(jobSkillsResponse.data?.job || null)

      } catch (err) {
        console.error('Error fetching suggested skills:', err)
        setError('無法載入建議技能')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestedSkills()
  }, [])

  if (isLoading) {
    return (
      <SoftCard>
        <SoftCardHeader>
          <SoftCardTitle>建議學習技能</SoftCardTitle>
          <SoftCardDescription>推薦您學習的技能</SoftCardDescription>
        </SoftCardHeader>
        <SoftCardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
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
          <SoftCardTitle>建議學習技能</SoftCardTitle>
          <SoftCardDescription className="text-red-500">{error}</SoftCardDescription>
        </SoftCardHeader>
      </SoftCard>
    )
  }

  return (
    <SoftCard>
      <SoftCardHeader>
        <SoftCardTitle>建議學習技能</SoftCardTitle>
        <SoftCardDescription>
          {currentJob ? `「${currentJob.name}」尚未學習的技能` : '推薦您學習的技能'}
        </SoftCardDescription>
        {currentJob && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              目前職位: {currentJob.name}
            </Badge>
          </div>
        )}
      </SoftCardHeader>
      <SoftCardContent>
        {suggestedSkills.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {suggestedSkills.map((skillItem) => (
              <div
                key={skillItem.id}
                className="h-16 flex items-center justify-center bg-gradient-warning text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight relative cursor-pointer hover:shadow-lg transition-shadow"
                title={`類別: ${skillItem.Skill.category}\n學習方式: ${skillItem.Skill.learningMethod}\n評估方式: ${skillItem.Skill.assessmentMethod}`}
              >
                <div className="absolute top-1 right-1">
                  <BookOpen className="h-3 w-3 text-white/80" />
                </div>
                <span className="break-words">{skillItem.Skill.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <div className="flex flex-col items-center gap-2">
              <Target className="h-8 w-8 text-gray-400" />
              <span>目前職位的技能都已學習完成！</span>
            </div>
          </div>
        )}
      </SoftCardContent>
    </SoftCard>
  )
}