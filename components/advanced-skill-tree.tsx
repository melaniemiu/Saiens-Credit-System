"use client"

import { SoftCard, SoftCardHeader, SoftCardContent, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/context/auth-context"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { toast } from "@/hooks/use-toast"
import { 
  calculateSkillDependencies, 
  generateSkillConnections, 
  buildDynamicSkillTree,
  suggestLearningPath,
  type SkillDependency,
  type SkillConnection,
  type SkillTreeNode
} from "@/lib/skill-dependencies"
import { 
  CheckCircle, Clock, Play, Award, ArrowRight, Lock, BookOpen, 
  Calendar, Target, Star, Zap, Shield, Sword, Crown, 
  TrendingUp, Eye, ZoomIn, ZoomOut, RotateCcw, Sparkles, BarChart3
} from "lucide-react"
import React from "react"
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
  }
}

interface JobLevel {
  name: string
  skills: SkillProgress[]
  isCompleted: boolean
  isCurrentLevel: boolean
  isLocked: boolean
  level: number
}

// Use SkillTreeNode from dependencies file instead of local interface

// Skill category icons and colors
const SKILL_CATEGORIES = {
  '山恩DNA': { icon: Crown, color: 'from-purple-500 to-purple-700', bgColor: 'bg-purple-900/20' },
  '產品知識': { icon: BookOpen, color: 'from-blue-500 to-blue-700', bgColor: 'bg-blue-900/20' },
  '工具使用': { icon: Sword, color: 'from-green-500 to-green-700', bgColor: 'bg-green-900/20' },
  '安裝知識': { icon: Shield, color: 'from-orange-500 to-orange-700', bgColor: 'bg-orange-900/20' },
  '安全操作': { icon: Zap, color: 'from-red-500 to-red-700', bgColor: 'bg-red-900/20' },
  'default': { icon: Star, color: 'from-gray-500 to-gray-700', bgColor: 'bg-gray-900/20' }
}

export function AdvancedSkillTree() {
  const { user } = useAuth()
  const [jobLevels, setJobLevels] = useState<JobLevel[]>([])
  const [skillNodes, setSkillNodes] = useState<SkillTreeNode[]>([])
  const [skillDependencies, setSkillDependencies] = useState<SkillDependency[]>([])
  const [skillConnections, setSkillConnections] = useState<SkillConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillProgress | null>(null)
  const [selectedSkillLocked, setSelectedSkillLocked] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [viewMode, setViewMode] = useState<'tree'>('tree')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSkillClick = useCallback((skill: SkillProgress, isLocked?: boolean) => {
    setSelectedSkill(skill)
    setSelectedSkillLocked(isLocked || false)
    setIsModalOpen(true)
  }, [])

  const fetchRoadmapData = async () => {
    try {
      setIsLoading(true)
      
      const progressionResponse = await apiClient.getDepartmentProgression()
      const { department, currentJob, jobProgression } = progressionResponse.data || {}

      if (!jobProgression) {
        throw new Error('No job progression data available')
      }

      // Calculate skill dependencies
      const dependencies = calculateSkillDependencies(jobProgression, [])
      setSkillDependencies(dependencies)

      // Generate skill connections
      const connections = generateSkillConnections(jobProgression, dependencies)
      setSkillConnections(connections)

      // Get completed skill IDs for dependency calculations
      const completedSkillIds: string[] = []
      jobProgression.forEach((job: any) => {
        job.skillsWithProgress?.forEach((jobSkill: any) => {
          if (jobSkill.userProgress?.status === 'completed' && 
              jobSkill.userProgress?.score >= 60) {
            completedSkillIds.push(jobSkill.skillId)
          }
        })
      })

      // Build dynamic skill tree with error handling
      try {
        const dynamicNodes = buildDynamicSkillTree(jobProgression, dependencies, completedSkillIds)
        setSkillNodes(dynamicNodes)
      } catch (skillTreeError) {
        console.error('Error building dynamic skill tree:', skillTreeError)
        // Fallback to empty nodes to prevent complete failure
        setSkillNodes([])
      }

      // Build job levels for UI display
      const levels: JobLevel[] = []
      jobProgression.forEach((job: any, jobIndex: number) => {
        const skillsForLevel = job.skillsWithProgress?.map((jobSkill: any, skillIndex: number) => ({
          id: jobSkill.userProgress?.id || `${jobSkill.skillId}-${jobIndex}-${skillIndex}-${Date.now()}`,
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
          isLocked: false,
          level: job.level || jobIndex + 1
        })
      })

      levels.sort((a, b) => a.level - b.level)
      setJobLevels(levels)
      setError(null)
    } catch (error) {
      console.error('Error fetching roadmap data:', error)
      setError('載入技能樹失敗，請稍後重試')
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
      await apiClient.updateSkillProgress(skill.skillId, { 
        status: 'in_progress',
        startedAt: new Date().toISOString()
      })
      
      toast({
        title: "開始學習",
        description: `已開始學習技能「${skill.Skill.name}」`,
      })
      
      setIsModalOpen(false)
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

  // Helper function to safely extract category name
  const getCategoryName = (category: string | { id: string; name: string; color?: string; icon?: string } | undefined): string => {
    if (!category) return 'default'
    if (typeof category === 'string') return category
    if (typeof category === 'object' && category.name) return category.name
    return 'default'
  }

  const getSkillCategoryInfo = (category: string | { id: string; name: string; color?: string; icon?: string } | undefined) => {
    const categoryName = getCategoryName(category)
    return SKILL_CATEGORIES[categoryName as keyof typeof SKILL_CATEGORIES] || SKILL_CATEGORIES.default
  }

  // Organize skills by category with hierarchical prerequisite rows
  const skillsByCategory = useMemo(() => {
    const categories: { [key: string]: { nodes: SkillTreeNode[], hierarchicalRows: Array<{ depth: number; title: string; nodes: SkillTreeNode[] }> } } = {}
    
    skillNodes.forEach(node => {
      // Safely extract category name
      const category = getCategoryName(node.category)
      
      if (!categories[category]) {
        categories[category] = { nodes: [], hierarchicalRows: [] }
      }
      categories[category].nodes.push(node)
    })

    // Create hierarchical organization for each category
    Object.keys(categories).forEach(categoryKey => {
      if (typeof categoryKey === 'string') {
        const categoryNodes = categories[categoryKey].nodes
        
        // Calculate prerequisite depth for each skill in this category
        const skillMap = new Map<string, SkillTreeNode>()
        categoryNodes.forEach(node => skillMap.set(node.skill.skillId, node))

        const calculateDepth = (skillId: string, visited = new Set<string>()): number => {
          if (visited.has(skillId)) return 0 // Circular dependency protection
          
          const dependency = skillDependencies.find(d => d.skillId === skillId)
          const prerequisites = dependency?.prerequisiteSkillIds || []
          
          if (prerequisites.length === 0) {
            return 0 // No prerequisites = depth 0
          }

          visited.add(skillId)
          const maxPrereqDepth = Math.max(
            0,
            ...prerequisites.map(prereqId => {
              // Only count prerequisites within the same category
              const prereqNode = skillMap.get(prereqId)
              return prereqNode ? calculateDepth(prereqId, new Set(visited)) : -1
            }).filter(depth => depth >= 0)
          )
          visited.delete(skillId)
          
          return maxPrereqDepth + 1
        }

        // Group nodes by prerequisite depth
        const depthGroups = new Map<number, SkillTreeNode[]>()
        categoryNodes.forEach(node => {
          const depth = calculateDepth(node.skill.skillId)
          if (!depthGroups.has(depth)) {
            depthGroups.set(depth, [])
          }
          depthGroups.get(depth)!.push(node)
        })

        // Create hierarchical rows
        const hierarchicalRows: Array<{ depth: number; title: string; nodes: SkillTreeNode[] }> = []
        const maxDepth = Math.max(...Array.from(depthGroups.keys()))

        for (let depth = 0; depth <= maxDepth; depth++) {
          const nodesAtDepth = depthGroups.get(depth) || []
          if (nodesAtDepth.length === 0) continue

          // Sort nodes within the same depth by name
          nodesAtDepth.sort((a, b) => a.skill.Skill.name.localeCompare(b.skill.Skill.name))

          const rowTitle = depth === 0 
            ? "基礎技能" 
            : depth === 1 
            ? "進階技能" 
            : depth === 2 
            ? "專精技能"
            : `第 ${depth + 1} 層技能`

          hierarchicalRows.push({
            depth,
            title: rowTitle,
            nodes: nodesAtDepth
          })
        }

        categories[categoryKey].hierarchicalRows = hierarchicalRows
      }
    })

    // Filter out any non-string keys and return only valid categories
    const validCategories: { [key: string]: { nodes: SkillTreeNode[], hierarchicalRows: Array<{ depth: number; title: string; nodes: SkillTreeNode[] }> } } = {}
    Object.entries(categories).forEach(([key, value]) => {
      if (typeof key === 'string' && key.trim()) {
        validCategories[key] = value
      }
    })

    return validCategories
  }, [skillNodes, skillDependencies])

  // Get skills for the active tab
  const activeTabSkills = useMemo(() => {
    if (activeTab === 'all') {
      return skillNodes
    }
    return skillsByCategory[activeTab]?.nodes || []
  }, [activeTab, skillNodes, skillsByCategory])

  // Get hierarchical rows for the active tab
  const activeTabHierarchicalRows = useMemo(() => {
    if (activeTab === 'all') {
      return []
    }
    return skillsByCategory[activeTab]?.hierarchicalRows || []
  }, [activeTab, skillsByCategory])

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

  const getSkillStatusClass = useCallback((skill: SkillProgress) => {
    const isCompleted = skill.status === 'completed' && skill.score && skill.score >= 60
    const isInProgress = skill.status === 'in_progress' || (skill.status === 'completed' && (!skill.score || skill.score < 60))
    
    if (isCompleted) return 'completed'
    if (isInProgress) return 'in-progress'
    return 'not-started'
  }, [])

  const uniqueCategories = useMemo(() => {
    const categories = skillNodes.map(node => {
      const category = node.skill.Skill?.category
      // Safely extract category name
      return getCategoryName(category)
    }).filter(cat => cat !== 'default')
    
    return Array.from(new Set(categories))
  }, [skillNodes])

  // Memoize filtered skills for performance
  const filteredJobLevels = useMemo(() => {
    if (!selectedCategory) return jobLevels
    
    return jobLevels.map(level => ({
      ...level,
      skills: level.skills.filter(skill => getCategoryName(skill.Skill.category) === selectedCategory)
    }))
  }, [jobLevels, selectedCategory])

  // Memoize filtered skill nodes for performance
  const filteredSkillNodes = useMemo(() => {
    if (!selectedCategory) return skillNodes
    
    return skillNodes.filter(node => getCategoryName(node.category) === selectedCategory)
  }, [skillNodes, selectedCategory])

  // Memoize skill statistics for performance based on active tab
  const skillStats = useMemo(() => {
    const tabSkills = activeTabSkills.map(node => node.skill)
    return {
      completed: tabSkills.filter(skill => {
        const status = getSkillStatusClass(skill)
        return status === 'completed'
      }).length,
      inProgress: tabSkills.filter(skill => {
        const status = getSkillStatusClass(skill)
        return status === 'in-progress'
      }).length,
      notStarted: tabSkills.filter(skill => {
        const status = getSkillStatusClass(skill)
        return status === 'not-started'
      }).length,
      total: tabSkills.length
    }
  }, [activeTabSkills, getSkillStatusClass])

  useEffect(() => {
    if (user) {
      fetchRoadmapData()
    }
  }, [user])

  // Debug logging to understand category structure
  useEffect(() => {
    console.log('🔍 Debug - skillsByCategory:', skillsByCategory)
    console.log('🔍 Debug - Object.keys(skillsByCategory):', Object.keys(skillsByCategory))
    console.log('🔍 Debug - activeTab:', activeTab)
    console.log('🔍 Debug - activeTabHierarchicalRows:', activeTabHierarchicalRows)
    
    const invalidCategories = Object.entries(skillsByCategory).filter(([category]) => typeof category !== 'string')
    if (invalidCategories.length > 0) {
      console.warn('Invalid categories found:', invalidCategories)
    }
  }, [skillsByCategory, activeTab, activeTabHierarchicalRows])

  if (isLoading) {
    return (
      <SoftCard>
        <SoftCardHeader>
          <SoftCardTitle>進階技能樹</SoftCardTitle>
          <SoftCardDescription>載入中...</SoftCardDescription>
        </SoftCardHeader>
        <SoftCardContent>
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        </SoftCardContent>
      </SoftCard>
    )
  }

  if (error) {
    return (
      <SoftCard>
        <SoftCardHeader>
          <SoftCardTitle>進階技能樹</SoftCardTitle>
          <SoftCardDescription className="text-red-500">{error}</SoftCardDescription>
        </SoftCardHeader>
      </SoftCard>
    )
  }

  return (
    <SoftCard className="w-full">
      <SoftCardHeader>
        <div className="flex items-center justify-between">
          <div>
            <SoftCardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              進階技能樹
            </SoftCardTitle>
            <SoftCardDescription>互動式技能發展路線圖</SoftCardDescription>
          </div>
          
          {/* Control Panel - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-100 font-medium">階層式技能樹</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.2))}
                disabled={zoomLevel >= 2}
                className="touch-manipulation"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
                disabled={zoomLevel <= 0.5}
                className="touch-manipulation"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(1)}
                className="touch-manipulation"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview - Mobile Responsive */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { key: 'completed', label: '已完成', color: 'text-green-600', value: skillStats.completed },
            { key: 'in-progress', label: '進行中', color: 'text-blue-600', value: skillStats.inProgress },
            { key: 'not-started', label: '未開始', color: 'text-gray-600', value: skillStats.notStarted },
            { key: 'total', label: '總計', color: 'text-purple-600', value: skillStats.total }
          ].map((stat) => (
            <div key={stat.key} className="text-center p-2 sm:p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100">
              <div className={`text-lg sm:text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Category Tabs - Mobile Responsive */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 border-b border-gray-200">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="text-xs sm:text-sm rounded-b-none border-b-2 border-transparent data-[active=true]:border-b-blue-500"
              data-active={activeTab === 'all'}
              onClick={() => {
                setActiveTab('all')
                setSelectedCategory(null)
              }}
            >
              <Star className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">全部技能</span>
              <span className="sm:hidden">全部</span>
            </Button>
            {Object.entries(skillsByCategory)
              .filter(([category, categoryData]) => {
                // Only show categories that are valid strings and have skills
                return typeof category === 'string' && 
                       category.trim() !== '' && 
                       category !== 'undefined' &&
                       category !== 'null' &&
                       categoryData.nodes && categoryData.nodes.length > 0
              })
              .map(([category, categoryData]) => {
                const categoryInfo = getSkillCategoryInfo(category)
                const IconComponent = categoryInfo.icon
                const skillCount = categoryData.nodes.length
                
                // Ensure category is displayed as string
                const displayCategory = String(category)
                
                return (
                  <Button
                    key={`tab-${displayCategory}`}
                    variant={activeTab === displayCategory ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setActiveTab(displayCategory)
                      setSelectedCategory(null)
                    }}
                    className="flex items-center gap-1 text-xs sm:text-sm rounded-b-none border-b-2 border-transparent data-[active=true]:border-b-blue-500 relative"
                    data-active={activeTab === displayCategory}
                  >
                    <IconComponent className="h-3 w-3" />
                    <span className="hidden sm:inline">{displayCategory}</span>
                    <span className="sm:hidden">{displayCategory.slice(0, 2)}</span>
                    <Badge 
                      variant="secondary" 
                      className="ml-1 text-xs px-1 py-0 h-4 min-w-[16px] text-center"
                    >
                      {skillCount}
                    </Badge>
                  </Button>
                )
              })}
          </div>
        </div>
      </SoftCardHeader>

      <SoftCardContent>
        {/* Advanced Skill Tree Visualization with Integrated Hierarchy - Mobile Optimized */}
        <div 
          ref={containerRef}
          className="relative w-full min-h-[400px] sm:min-h-[600px] lg:min-h-[800px] max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-auto touch-pan-x touch-pan-y"
          style={{
            height: activeTab !== 'all' && activeTabHierarchicalRows.length > 0 
              ? `${Math.max(600, activeTabHierarchicalRows.length * 300 + 200)}px`
              : undefined
          }}
        >
          {/* Animated Background */}
          <div className="absolute inset-0">
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />
            
            {/* Floating Orbs - Optimized for Mobile */}
            {[...Array(Math.max(4, Math.floor(10 / zoomLevel)))].map((_, i) => {
              // Use deterministic positioning based on index to avoid render conflicts
              const seedX = (i * 37) % 100 // Pseudo-random but deterministic
              const seedY = (i * 73) % 100
              const seedSize = Math.min((i * 13) % 30 + 15, 35) // Smaller max size for mobile
              const seedDelay = (i * 2.3) % 10
              const seedDuration = (i * 1.7) % 8 + 8 // Shorter duration for better performance
              
              return (
                <div
                  key={`floating-orb-${i}-${zoomLevel}`}
                  className="absolute rounded-full bg-white/3 animate-float-slow will-change-transform"
                  style={{
                    left: `${seedX}%`,
                    top: `${seedY}%`,
                    width: `${seedSize}px`,
                    height: `${seedSize}px`,
                    animationDelay: `${seedDelay}s`,
                    animationDuration: `${seedDuration}s`
                  }}
                />
              )
            })}
          </div>

          {/* Skill Tree Container - Tab-based Rendering */}
          <div 
            className="absolute inset-0 transition-transform duration-500 ease-out"
            style={{ 
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center top'
            }}
          >
            {activeTab === 'all' ? (
              // Traditional job-level tree view with hierarchy guidance
              <div className="relative h-full w-full">
                {/* Connection Lines for Job Levels */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                      <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
                    </linearGradient>
                  </defs>
                  
                  {/* Job Level Connections */}
                  {filteredJobLevels.map((level, index) => {
                    if (index === 0) return null
                    return (
                      <g key={`connection-${level.name}-${index}`}>
                        <line
                          x1="50%"
                          y1={(index - 1) * 250 + 250}
                          x2="50%"
                          y2={index * 250 + 50}
                          stroke="url(#connectionGradient)"
                          strokeWidth="3"
                          filter="url(#glow)"
                          className="animate-pulse"
                        />
                      </g>
                    )
                  })}
                </svg>

                {/* Job Level Skills */}
                <div className="relative z-10">
                  {filteredJobLevels.map((level, levelIndex) => (
                    <div key={level.name} className="absolute w-full" style={{ top: `${levelIndex * 250 + 50}px` }}>
                      {/* Job Level Title */}
                      <div className="text-center mb-8">
                        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-lg shadow-xl backdrop-blur-sm border ${
                          level.isCurrentLevel 
                            ? 'bg-gradient-to-r from-blue-500/90 to-blue-700/90 border-blue-300' 
                            : level.isCompleted 
                            ? 'bg-gradient-to-r from-green-500/90 to-green-700/90 border-green-300'
                            : 'bg-gradient-to-r from-gray-600/90 to-gray-800/90 border-gray-500'
                        }`}>
                          {level.name}
                        </div>
                      </div>

                      {/* Skills for this job level */}
                      <div className="flex flex-wrap justify-center gap-4">
                        {level.skills.map((skill, skillIndex) => {
                          const statusClass = getSkillStatusClass(skill)
                          const categoryInfo = getSkillCategoryInfo(skill.Skill?.category)
                          const IconComponent = categoryInfo.icon
                          
                          return (
                            <div
                              key={`skill-${skill.skillId}-${levelIndex}-${skillIndex}`}
                              className="cursor-pointer touch-manipulation"
                              onClick={() => handleSkillClick(skill, false)}
                              onTouchStart={(e) => e.stopPropagation()}
                            >
                              {/* Skill Node */}
                              <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 sm:border-3 flex items-center justify-center transition-all duration-500 hover:scale-125 hover:-translate-y-2 ${
                                statusClass === 'completed'
                                  ? `bg-gradient-to-br ${categoryInfo.color} border-yellow-300 shadow-2xl shadow-yellow-500/60`
                                  : statusClass === 'in-progress'
                                  ? `bg-gradient-to-br ${categoryInfo.color} border-blue-300 shadow-2xl shadow-blue-500/60 animate-pulse`
                                  : `bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500 opacity-70 hover:opacity-90 shadow-lg`
                              }`}>
                                
                                {/* Category Icon */}
                                <div className="text-white relative z-10">
                                  <IconComponent className="h-6 w-6 sm:h-8 sm:w-8" />
                                </div>
                                
                                {/* Status Badge */}
                                <div className="absolute -top-2 -right-2">
                                  {statusClass === 'completed' && (
                                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                                      <Award className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Skill Name */}
                              <div className="text-center mt-2 max-w-20 sm:max-w-24">
                                <div className="text-xs sm:text-sm font-medium text-white truncate">
                                  {skill.Skill.name}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Category-specific prerequisite-ordered view
              <div className="relative h-full w-full p-4">
                <div className="max-w-6xl mx-auto pb-12">
                  {/* Category Title */}
                  <div className="text-center mb-8">
                    {(() => {
                      const categoryInfo = getSkillCategoryInfo(activeTab)
                      const IconComponent = categoryInfo.icon
                      return (
                        <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-lg text-white font-bold text-xl shadow-2xl backdrop-blur-sm border bg-gradient-to-r ${categoryInfo.color} border-white/20`}>
                          <IconComponent className="h-8 w-8" />
                          {activeTab}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Hierarchical Skills by Prerequisite Depth */}
                  <div className="space-y-12 pb-8">
                    {activeTabHierarchicalRows.map((row, rowIndex) => (
                      <div key={`row-${row.depth}-${rowIndex}`} className="space-y-6">
                        {/* Row Header */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {row.depth + 1}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{row.title}</h3>
                              <p className="text-sm text-white/70">
                                {row.depth === 0 
                                  ? "不需要前置技能的基礎技能" 
                                  : `需要完成前 ${row.depth} 層相關技能的進階技能`}
                              </p>
                            </div>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
                          <div className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm">
                            {row.nodes.length} 項技能
                          </div>
                        </div>

                        {/* Skills Grid for this row */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-4">
                          {row.nodes.map((node, index) => {
                      const skill = node.skill
                      const statusClass = getSkillStatusClass(skill)
                      const categoryInfo = getSkillCategoryInfo(skill.Skill?.category)
                      const IconComponent = categoryInfo.icon
                      const dependency = skillDependencies.find(d => d.skillId === skill.skillId)
                      const isLocked = !node.prerequisitesMet
                      
                      return (
                        <div
                          key={`category-skill-${skill.skillId}-${index}`}
                          className={`relative cursor-pointer touch-manipulation transition-all duration-300 ${
                            isLocked ? 'opacity-70' : 'hover:scale-105'
                          }`}
                          onClick={() => handleSkillClick(skill, isLocked)}
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          {/* Skill Card */}
                          <div className={`relative p-3 rounded-xl border-2 backdrop-blur-sm transition-all duration-500 ${
                            statusClass === 'completed'
                              ? `bg-gradient-to-br ${categoryInfo.color} border-yellow-300 shadow-xl shadow-yellow-500/30`
                              : statusClass === 'in-progress'
                              ? `bg-gradient-to-br ${categoryInfo.color} border-blue-300 shadow-xl shadow-blue-500/30 animate-pulse`
                              : isLocked
                              ? `bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600`
                              : `bg-gradient-to-br from-gray-600/80 to-gray-800/80 border-gray-500 hover:border-gray-400`
                          }`}>
                            
                            {/* Skill Icon */}
                            <div className="flex justify-center mb-2">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center">
                                {isLocked ? (
                                  <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                ) : (
                                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                )}
                              </div>
                            </div>
                            
                            {/* Skill Info */}
                            <div className="text-center">
                              <h3 className="text-sm sm:text-base font-semibold text-white mb-2 line-clamp-2">
                                {skill.Skill.name}
                              </h3>
                              
                              {/* Prerequisites Count */}
                              {dependency?.prerequisiteSkillIds.length > 0 && (
                                <div className="text-xs text-white/60 mt-1">
                                  前置: {dependency.prerequisiteSkillIds.length} 項
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Skill Detail Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 shadow-2xl rounded-xl max-h-[85vh]">
            {selectedSkill && selectedSkill.Skill && selectedSkill.Skill.category && (
              <div className="overflow-y-auto max-h-[85vh]">
                {/* Modal Header with Category Theme */}
                <div className={`p-6 bg-gradient-to-r ${getSkillCategoryInfo(selectedSkill.Skill.category).color}`}>
                  <DialogHeader>
                    <div className="flex items-center gap-4 text-white">
                      <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm">
                        {React.createElement(getSkillCategoryInfo(selectedSkill.Skill.category).icon, { className: "h-8 w-8" })}
                      </div>
                      <div>
                        <DialogTitle className="text-2xl font-bold text-white mb-1">
                          {selectedSkill.Skill.name}
                        </DialogTitle>
                        <Badge className="bg-white/20 text-white border-white/30">
                          {getCategoryName(selectedSkill.Skill.category)}
                        </Badge>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status and Progress */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50 border">
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        學習狀態
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedSkill.status, selectedSkill.score, "h-5 w-5")}
                        <span className="font-medium">
                          {selectedSkill.status === 'not_started' && '未開始'}
                          {selectedSkill.status === 'in_progress' && '學習中'}
                          {selectedSkill.status === 'completed' && selectedSkill.score && selectedSkill.score >= 60 && '已通過'}
                          {selectedSkill.status === 'completed' && (!selectedSkill.score || selectedSkill.score < 60) && '等待評估'}
                        </span>
                      </div>
                    </div>
                    
                    {selectedSkill.score && (
                      <div className="p-4 rounded-lg bg-gray-50 border">
                        <h3 className="font-semibold text-gray-800 mb-2">評估分數</h3>
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          <span className="text-2xl font-bold">{selectedSkill.score}</span>
                          <span className="text-gray-500">/ 100</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Learning Methods */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border">
                      <h3 className="font-semibold text-gray-800 mb-2">學習方式</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {selectedSkill.Skill.learningMethod}
                      </Badge>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <h3 className="font-semibold text-gray-800 mb-2">評估方式</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {selectedSkill.Skill.assessmentMethod}
                      </Badge>
                    </div>
                  </div>

                  {/* Syllabus */}
                  {selectedSkill.Skill.syllabus && (
                    <div className="p-4 rounded-lg border">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        學習大綱
                      </h3>
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {selectedSkill.Skill.syllabus}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedSkillLocked && (
                      <div className="flex-1 p-3 rounded-lg bg-gray-100 border border-gray-300 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <Lock className="h-4 w-4" />
                          <span className="text-sm">需完成前置技能才能開始學習</span>
                        </div>
                      </div>
                    )}
                    
                    {!selectedSkillLocked && selectedSkill.status === 'not_started' && (
                      <Button
                        onClick={() => handleStartLearning(selectedSkill)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        開始學習
                      </Button>
                    )}
                    
                    {!selectedSkillLocked && ((selectedSkill.status === 'completed' && (!selectedSkill.score || selectedSkill.score < 60)) || selectedSkill.status === 'in_progress') && 
                     (!selectedSkill.evaluationRequestedAt || (selectedSkill.evaluatedAt && selectedSkill.evaluatedAt >= selectedSkill.evaluationRequestedAt)) && (
                      <Button
                        onClick={() => handleStartEvaluation(selectedSkill)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        申請評估
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Custom CSS */}
        <style jsx>{`
          @keyframes float-slow {
            0%, 100% {
              transform: translateY(0px) translateX(0px);
              opacity: 0.3;
            }
            33% {
              transform: translateY(-10px) translateX(5px);
              opacity: 0.6;
            }
            66% {
              transform: translateY(5px) translateX(-5px);
              opacity: 0.4;
            }
          }
          .animate-float-slow {
            animation: float-slow 15s ease-in-out infinite;
          }
        `}</style>
      </SoftCardContent>
    </SoftCard>
  )
}