"use client"

import { SoftCard, SoftCardHeader, SoftCardContent, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api-client"
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
        const userSkillsResponse = await apiClient.getUserSkills()
        const userSkills = userSkillsResponse.data?.userSkills || []
        
        // Get skills for user's current job level
        const jobSkillsResponse = await apiClient.getJobSkills()
        const jobSkillsData = jobSkillsResponse.data?.skillsWithProgress || []
        
        // Find unlearned skills from current job level
        const unlearnedSkills = jobSkillsData
          .filter(jobSkill => {
            // Find if user has progress on this skill
            const userProgress = userSkills.find(us => us.skillId === jobSkill.Skill.id)
            // Show skills that are not started or in progress (not completed/certified)
            return !userProgress || userProgress.status === 'not_started' || userProgress.status === 'in_progress'
          })
          .sort((a, b) => {
            // Sort by required status first (必修 first, then 選修)
            if (a.Skill.isRequired && !b.Skill.isRequired) return -1
            if (!a.Skill.isRequired && b.Skill.isRequired) return 1
            return a.Skill.name.localeCompare(b.Skill.name) // Then by name
          })
          .slice(0, 6) // Increase limit to show more skills
        
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
          <div className="flex flex-wrap gap-2">
            {suggestedSkills.map((skillItem) => {
              const isRequired = skillItem.Skill.isRequired
              const badgeClasses = isRequired
                ? "inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-full text-xs font-medium border border-red-200 shadow-sm hover:bg-red-200 transition-colors cursor-pointer"
                : "inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200 shadow-sm hover:bg-blue-200 transition-colors cursor-pointer"
              const iconClasses = isRequired ? "h-4 w-4 text-red-600 flex-shrink-0" : "h-4 w-4 text-blue-600 flex-shrink-0"
              
              return (
                <div
                  key={skillItem.id}
                  className={badgeClasses}
                  title={`${isRequired ? '[必]' : '[選]'}\n類別: ${skillItem.Skill.category}\n學習方式: ${skillItem.Skill.learningMethod}\n評估方式: ${skillItem.Skill.assessmentMethod}`}
                >
                  <BookOpen className={iconClasses} />
                  <span className="break-words">
                    {isRequired && <span className="font-bold text-red-900">[必] </span>}
                    {!isRequired && <span className="font-bold text-blue-900">[選] </span>}
                    {skillItem.Skill.name}
                  </span>
                </div>
              )
            })}
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