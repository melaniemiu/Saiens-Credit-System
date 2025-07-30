"use client"

import { SoftCard, SoftCardHeader, SoftCardContent } from "@/components/ui/soft-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/context/auth-context"
import { useEffect, useState, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import { 
  CheckCircle, Clock, Play, Award, ArrowRight, Lock, BookOpen, 
  Calendar, Target, Star, Zap, Shield, Sword, Crown, 
  TrendingUp, Eye, ChevronDown, ChevronUp, ArrowDown
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
    category: string | { id: string; name: string; color?: string; icon?: string }
    learningMethod: string
    assessmentMethod: string
    syllabus?: string
    prerequisites?: Array<{ id: string; name: string }>
  }
}

interface SkillNode {
  skill: SkillProgress
  prerequisiteDepth: number
  prerequisites: string[]
  isLocked: boolean
}

interface SkillRow {
  depth: number
  title: string
  description: string
  skills: SkillNode[]
}

// Skill category icons and colors
const SKILL_CATEGORIES = {
  '山恩DNA': { icon: Crown, color: 'from-purple-500 to-purple-700', bgColor: 'bg-purple-900/20', textColor: 'text-purple-600' },
  '產品知識': { icon: BookOpen, color: 'from-blue-500 to-blue-700', bgColor: 'bg-blue-900/20', textColor: 'text-blue-600' },
  '工具使用': { icon: Sword, color: 'from-green-500 to-green-700', bgColor: 'bg-green-900/20', textColor: 'text-green-600' },
  '安裝知識': { icon: Shield, color: 'from-orange-500 to-orange-700', bgColor: 'bg-orange-900/20', textColor: 'text-orange-600' },
  '安全操作': { icon: Zap, color: 'from-red-500 to-red-700', bgColor: 'bg-red-900/20', textColor: 'text-red-600' },
  'default': { icon: Star, color: 'from-gray-500 to-gray-700', bgColor: 'bg-gray-900/20', textColor: 'text-gray-600' }
}

const getSkillCategoryInfo = (category: string | { name: string }) => {
  const categoryName = typeof category === 'string' ? category : category?.name || 'default'
  return SKILL_CATEGORIES[categoryName as keyof typeof SKILL_CATEGORIES] || SKILL_CATEGORIES.default
}

const getSkillStatusClass = (skill: SkillProgress) => {
  switch (skill.status) {
    case 'completed':
      return 'completed'
    case 'in_progress':
      return 'in-progress'
    default:
      return 'not-started'
  }
}

export function HierarchicalSkillTree({ selectedCategory }: { selectedCategory?: string }) {
  const { user } = useAuth()
  const [skillRows, setSkillRows] = useState<SkillRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillProgress | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set([0])) // First row expanded by default

  const handleSkillClick = useCallback((skill: SkillProgress) => {
    setSelectedSkill(skill)
    setIsModalOpen(true)
  }, [])

  const toggleRowExpansion = (depth: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(depth)) {
        newSet.delete(depth)
      } else {
        newSet.add(depth)
      }
      return newSet
    })
  }

  const organizeSkillsByDepth = (skills: SkillProgress[], completedSkillIds: string[]): SkillRow[] => {
    const skillMap = new Map<string, SkillProgress>()
    skills.forEach(skill => skillMap.set(skill.skillId, skill))

    // Calculate prerequisite depth for each skill
    const calculateDepth = (skillId: string, visited = new Set<string>()): number => {
      if (visited.has(skillId)) return 0 // Circular dependency protection
      
      const skill = skillMap.get(skillId)
      if (!skill?.Skill?.prerequisites || skill.Skill.prerequisites.length === 0) {
        return 0 // No prerequisites = depth 0
      }

      visited.add(skillId)
      const maxPrereqDepth = Math.max(
        0,
        ...skill.Skill.prerequisites.map(prereq => calculateDepth(prereq.id, new Set(visited)))
      )
      visited.delete(skillId)
      
      return maxPrereqDepth + 1
    }

    // Create skill nodes with depth information
    const skillNodes: SkillNode[] = skills.map(skill => {
      const depth = calculateDepth(skill.skillId)
      const prerequisites = skill.Skill?.prerequisites?.map(p => p.id) || []
      const isLocked = prerequisites.some(prereqId => !completedSkillIds.includes(prereqId))

      return {
        skill,
        prerequisiteDepth: depth,
        prerequisites,
        isLocked
      }
    })

    // Filter by selected category if provided
    const filteredNodes = selectedCategory 
      ? skillNodes.filter(node => {
          const categoryName = typeof node.skill.Skill.category === 'string' 
            ? node.skill.Skill.category 
            : node.skill.Skill.category?.name || 'default'
          return categoryName === selectedCategory
        })
      : skillNodes

    // Group by depth
    const depthGroups = new Map<number, SkillNode[]>()
    filteredNodes.forEach(node => {
      if (!depthGroups.has(node.prerequisiteDepth)) {
        depthGroups.set(node.prerequisiteDepth, [])
      }
      depthGroups.get(node.prerequisiteDepth)!.push(node)
    })

    // Create skill rows
    const rows: SkillRow[] = []
    const maxDepth = Math.max(...Array.from(depthGroups.keys()))

    for (let depth = 0; depth <= maxDepth; depth++) {
      const skillsAtDepth = depthGroups.get(depth) || []
      if (skillsAtDepth.length === 0) continue

      // Sort skills within the same depth by category and name
      skillsAtDepth.sort((a, b) => {
        const aCat = typeof a.skill.Skill.category === 'string' ? a.skill.Skill.category : a.skill.Skill.category?.name || ''
        const bCat = typeof b.skill.Skill.category === 'string' ? b.skill.Skill.category : b.skill.Skill.category?.name || ''
        
        if (aCat !== bCat) return aCat.localeCompare(bCat)
        return a.skill.Skill.name.localeCompare(b.skill.Skill.name)
      })

      const rowTitle = depth === 0 
        ? "基礎技能" 
        : depth === 1 
        ? "進階技能" 
        : depth === 2 
        ? "專精技能"
        : `第 ${depth + 1} 層技能`

      const rowDescription = depth === 0
        ? "不需要前置技能的基礎技能"
        : `需要完成前 ${depth} 層相關技能的進階技能`

      rows.push({
        depth,
        title: rowTitle,
        description: rowDescription,
        skills: skillsAtDepth
      })
    }

    return rows
  }

  const fetchSkillData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const progressionResponse = await apiClient.getDepartmentProgression()
      const { jobProgression } = progressionResponse.data || {}

      if (!jobProgression) {
        throw new Error('No job progression data available')
      }

      // Extract all skills from job progression
      const allSkills: SkillProgress[] = []
      const completedSkillIds: string[] = []

      jobProgression.forEach((job: any) => {
        job.skillsWithProgress?.forEach((jobSkill: any) => {
          // Add job level information to skill
          const skillWithJobLevel = {
            ...jobSkill,
            jobLevel: job.name
          }
          allSkills.push(skillWithJobLevel)

          if (jobSkill.status === 'completed') {
            completedSkillIds.push(jobSkill.skillId)
          }
        })
      })

      // Organize skills into hierarchical rows
      const rows = organizeSkillsByDepth(allSkills, completedSkillIds)
      setSkillRows(rows)

    } catch (error: any) {
      console.error('Error fetching skill data:', error)
      setError(error.message || 'Failed to load skill data')
      toast({
        title: "錯誤",
        description: "載入技能資料失敗",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSkillData()
  }, [selectedCategory])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <SoftCard key={i}>
            <SoftCardContent className="p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-32" />
                ))}
              </div>
            </SoftCardContent>
          </SoftCard>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <SoftCard>
        <SoftCardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">載入失敗</div>
          <Button onClick={fetchSkillData} variant="outline">
            重新載入
          </Button>
        </SoftCardContent>
      </SoftCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Title */}
      {selectedCategory && (
        <div className="text-center mb-8">
          {(() => {
            const categoryInfo = getSkillCategoryInfo(selectedCategory)
            const IconComponent = categoryInfo.icon
            return (
              <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-xl shadow-2xl backdrop-blur-sm border bg-gradient-to-r ${categoryInfo.color} border-white/20`}>
                <IconComponent className="h-8 w-8" />
                {selectedCategory}
              </div>
            )
          })()}
        </div>
      )}

      {/* Hierarchical Skill Rows */}
      {skillRows.map((row, rowIndex) => {
        const isExpanded = expandedRows.has(row.depth)
        
        return (
          <SoftCard key={row.depth}>
            <SoftCardHeader 
              className="cursor-pointer select-none"
              onClick={() => toggleRowExpansion(row.depth)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {row.depth + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{row.title}</h3>
                      <p className="text-sm text-muted-foreground">{row.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {row.skills.length} 項技能
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {rowIndex < skillRows.length - 1 && (
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </SoftCardHeader>
            
            {isExpanded && (
              <SoftCardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {row.skills.map((node, index) => {
                    const skill = node.skill
                    const statusClass = getSkillStatusClass(skill)
                    const categoryInfo = getSkillCategoryInfo(skill.Skill?.category)
                    const IconComponent = categoryInfo.icon
                    const isLocked = node.isLocked
                    
                    return (
                      <div
                        key={`${skill.skillId}-${index}`}
                        className={`relative cursor-pointer transition-all duration-300 ${
                          isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                        onClick={() => !isLocked && handleSkillClick(skill)}
                      >
                        {/* Skill Card */}
                        <div className={`relative p-4 rounded-xl border-2 backdrop-blur-sm transition-all duration-500 ${
                          statusClass === 'completed'
                            ? `bg-gradient-to-br ${categoryInfo.color} border-yellow-300 shadow-xl shadow-yellow-500/30`
                            : statusClass === 'in-progress'
                            ? `bg-gradient-to-br ${categoryInfo.color} border-blue-300 shadow-xl shadow-blue-500/30 animate-pulse`
                            : isLocked
                            ? `bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600`
                            : `bg-gradient-to-br from-gray-600/80 to-gray-800/80 border-gray-500 hover:border-gray-400`
                        }`}>
                          
                          {/* Lock Overlay */}
                          {isLocked && (
                            <div className="absolute inset-0 bg-gray-900/50 rounded-xl flex items-center justify-center">
                              <Lock className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Skill Icon */}
                          <div className="flex justify-center mb-3">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          
                          {/* Skill Info */}
                          <div className="text-center">
                            <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                              {skill.Skill.name}
                            </h3>
                            <p className="text-xs text-white/70 mb-2">
                              {skill.jobLevel}
                            </p>
                            
                            {/* Prerequisites Count */}
                            {node.prerequisites.length > 0 && (
                              <div className="text-xs text-white/60">
                                需要 {node.prerequisites.length} 項前置技能
                              </div>
                            )}
                          </div>
                          
                          {/* Status Badge */}
                          <div className="absolute -top-2 -right-2">
                            {statusClass === 'completed' && (
                              <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                                <Award className="h-3 w-3 text-white" />
                              </div>
                            )}
                            {statusClass === 'in-progress' && (
                              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                <Clock className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SoftCardContent>
            )}
          </SoftCard>
        )
      })}

      {/* Skill Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedSkill && (() => {
                const categoryInfo = getSkillCategoryInfo(selectedSkill.Skill?.category)
                const IconComponent = categoryInfo.icon
                return (
                  <>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${categoryInfo.color} flex items-center justify-center`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{selectedSkill.Skill.name}</div>
                      <div className="text-sm text-muted-foreground font-normal">
                        {typeof selectedSkill.Skill.category === 'string' 
                          ? selectedSkill.Skill.category 
                          : selectedSkill.Skill.category?.name}
                      </div>
                    </div>
                  </>
                )
              })()}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSkill && (
            <div className="space-y-6">
              {/* Status and Score */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  {getSkillStatusClass(selectedSkill) === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {getSkillStatusClass(selectedSkill) === 'in-progress' && (
                    <Clock className="h-5 w-5 text-blue-500" />
                  )}
                  {getSkillStatusClass(selectedSkill) === 'not-started' && (
                    <Play className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="font-medium">
                    {selectedSkill.status === 'completed' ? '已完成' : 
                     selectedSkill.status === 'in_progress' ? '進行中' : '未開始'}
                  </span>
                  {selectedSkill.score && (
                    <Badge variant="outline">{selectedSkill.score} 分</Badge>
                  )}
                </div>
              </div>

              {/* Learning and Assessment Methods */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">學習方式</h4>
                  <Badge variant="outline">{selectedSkill.Skill.learningMethod}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">評核方式</h4>
                  <Badge variant="outline">{selectedSkill.Skill.assessmentMethod}</Badge>
                </div>
              </div>

              {/* Prerequisites */}
              {selectedSkill.Skill.prerequisites && selectedSkill.Skill.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">前置技能需求</h4>
                  <div className="space-y-2">
                    {selectedSkill.Skill.prerequisites.map((prereq) => (
                      <div key={prereq.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{prereq.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Syllabus */}
              {selectedSkill.Skill.syllabus && (
                <div>
                  <h4 className="font-medium mb-2">學習大綱</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{selectedSkill.Skill.syllabus}</pre>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-2 text-sm text-muted-foreground">
                {selectedSkill.startedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    開始日期: {new Date(selectedSkill.startedAt).toLocaleDateString('zh-TW')}
                  </div>
                )}
                {selectedSkill.completedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    完成日期: {new Date(selectedSkill.completedAt).toLocaleDateString('zh-TW')}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}