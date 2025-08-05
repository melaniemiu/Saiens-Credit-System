// Skill dependency management utilities
export interface SkillDependency {
  skillId: string
  prerequisiteSkillIds: string[]
  jobLevel: number
  isRequired: boolean
  isUnlocked: (completedSkills: string[]) => boolean
}

export interface SkillConnection {
  from: string
  to: string
  type: 'prerequisite' | 'sequence' | 'related' | 'job_progression'
}

export interface SkillTreeNode {
  skill: any
  x: number
  y: number
  connections: string[]
  category: string
  jobLevel: number
  unlocked: boolean
  prerequisitesMet: boolean
}

/**
 * Calculate skill dependencies and unlock status based on job progression
 */
export const calculateSkillDependencies = (
  jobProgression: any[],
  completedSkillIds: string[]
): SkillDependency[] => {
  const dependencies: SkillDependency[] = []
  
  jobProgression.forEach((job, jobIndex) => {
    const jobLevel = job.level || jobIndex + 1
    
    job.skillsWithProgress?.forEach((jobSkill: any) => {
      // Use actual prerequisite data from the database
      const prerequisiteSkillIds = jobSkill.Skill?.prerequisites?.map((prereq: any) => prereq.id) || []
      
      dependencies.push({
        skillId: jobSkill.skillId,
        prerequisiteSkillIds,
        jobLevel,
        isRequired: false, // No longer using isRequired field
        isUnlocked: (completed: string[]) => {
          // Check if all prerequisites are completed
          return prerequisiteSkillIds.every(prereqId => 
            completed.includes(prereqId)
          )
        }
      })
    })
  })
  
  return dependencies
}

/**
 * Generate connection lines between related skills based on dependencies
 */
export const generateSkillConnections = (
  jobProgression: any[],
  dependencies: SkillDependency[]
): SkillConnection[] => {
  const connections: SkillConnection[] = []
  
  // Generate prerequisite connections
  dependencies.forEach(dep => {
    dep.prerequisiteSkillIds.forEach(prereqId => {
      connections.push({
        from: prereqId,
        to: dep.skillId,
        type: 'prerequisite'
      })
    })
  })
  
  // Generate job progression connections (simplified since we now use actual prerequisites)
  // This section is less relevant since we have explicit prerequisite relationships
  
  // Generate category-based connections (related skills)
  const skillsByCategory: { [key: string]: any[] } = {}
  jobProgression.forEach(job => {
    job.skillsWithProgress?.forEach((jobSkill: any) => {
      const category = jobSkill.Skill?.category || 'default'
      if (!skillsByCategory[category]) {
        skillsByCategory[category] = []
      }
      skillsByCategory[category].push(jobSkill)
    })
  })
  
  // Connect related skills within categories
  Object.entries(skillsByCategory).forEach(([category, skills]) => {
    if (skills.length > 1) {
      for (let i = 0; i < skills.length - 1; i++) {
        connections.push({
          from: skills[i].skillId,
          to: skills[i + 1].skillId,
          type: 'related'
        })
      }
    }
  })
  
  return connections
}

/**
 * Calculate skill positions for constellation view
 */
export const calculateConstellationPositions = (
  skills: any[],
  categories: string[]
): { skillId: string; x: number; y: number; category: string }[] => {
  const positions: { skillId: string; x: number; y: number; category: string }[] = []
  
  categories.forEach((category, categoryIndex) => {
    const categorySkills = skills.filter(skill => skill.Skill.category === category)
    const categoryAngle = (categoryIndex / categories.length) * 2 * Math.PI
    const categoryRadius = 200
    
    // Position category center
    const categoryCenterX = Math.cos(categoryAngle) * categoryRadius
    const categoryCenterY = Math.sin(categoryAngle) * categoryRadius
    
    // Position skills within category
    categorySkills.forEach((skill, skillIndex) => {
      const skillAngle = (skillIndex / categorySkills.length) * 2 * Math.PI
      const skillRadius = 60
      
      positions.push({
        skillId: skill.id,
        x: categoryCenterX + Math.cos(skillAngle) * skillRadius,
        y: categoryCenterY + Math.sin(skillAngle) * skillRadius,
        category
      })
    })
  })
  
  return positions
}

/**
 * Get skill mastery level based on score and status
 */
export const getSkillMasteryLevel = (skill: any): {
  level: 'novice' | 'apprentice' | 'expert' | 'master'
  color: string
  description: string
} => {
  const { status, score, attempts } = skill
  
  if (status === 'completed' && score >= 90) {
    return {
      level: 'master',
      color: 'from-yellow-400 to-yellow-600',
      description: '大師級 (90+ 分)'
    }
  } else if (status === 'completed' && score >= 80) {
    return {
      level: 'expert',
      color: 'from-orange-400 to-orange-600',
      description: '專家級 (80-89 分)'
    }
  } else if (status === 'completed' && score >= 60) {
    return {
      level: 'apprentice',
      color: 'from-green-400 to-green-600',
      description: '熟練級 (60-79 分)'
    }
  } else {
    return {
      level: 'novice',
      color: 'from-gray-400 to-gray-600',
      description: '新手級'
    }
  }
}

/**
 * Build dynamic skill tree with proper positioning and dependencies
 */
export const buildDynamicSkillTree = (
  jobProgression: any[],
  dependencies: SkillDependency[],
  completedSkillIds: string[]
): SkillTreeNode[] => {
  const nodes: SkillTreeNode[] = []
  
  // Validate input data
  if (!Array.isArray(jobProgression)) {
    console.warn('Invalid jobProgression data:', jobProgression)
    return nodes
  }
  
  jobProgression.forEach((job, jobIndex) => {
    if (!job || typeof job !== 'object') {
      console.warn(`Invalid job data at index ${jobIndex}:`, job)
      return
    }
    
    const jobLevel = job.level || jobIndex + 1
    const skillsInJob = job.skillsWithProgress || []
    
    if (!Array.isArray(skillsInJob)) {
      console.warn(`Invalid skillsWithProgress for job ${job.name}:`, skillsInJob)
      return
    }
    
    skillsInJob.forEach((jobSkill: any, skillIndex: number) => {
      // Validate skill data
      if (!jobSkill || !jobSkill.skillId || !jobSkill.Skill) {
        console.warn(`Invalid jobSkill data in job ${job.name} at index ${skillIndex}:`, jobSkill)
        return
      }
      
      const dependency = dependencies.find(d => d.skillId === jobSkill.skillId)
      const prerequisitesMet = dependency?.isUnlocked(completedSkillIds) ?? true
      
      // Calculate position based on job level and skill category
      let category = 'default'
      
      // Handle different category data structures
      if (jobSkill.Skill?.category) {
        if (typeof jobSkill.Skill.category === 'string') {
          category = jobSkill.Skill.category
        } else if (typeof jobSkill.Skill.category === 'object' && jobSkill.Skill.category.name) {
          category = jobSkill.Skill.category.name
        }
      }
      
      // Final validation: ensure category is a valid string
      if (typeof category !== 'string' || !category.trim()) {
        category = 'default'
      }
      const categoryIndex = getCategoryIndex(category)
      
      // Improved positioning algorithm for mobile
      const baseRadius = 80 + (jobLevel * 60) // Smaller base radius for mobile
      const skillsPerLevel = skillsInJob.length
      const angleStep = (2 * Math.PI) / skillsPerLevel
      const angle = skillIndex * angleStep - Math.PI / 2
      
      // Add category-based offset for better separation
      const categoryOffset = (categoryIndex * 20) - 40
      const radius = baseRadius + categoryOffset
      
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius + (jobLevel * 150) // Reduced spacing for mobile
      
      // Determine connections from dependency data
      const connections = dependency?.prerequisiteSkillIds || []
      
      nodes.push({
        skill: {
          id: jobSkill.userProgress?.id || `${jobSkill.skillId}-${jobIndex}-${skillIndex}`,
          skillId: jobSkill.skillId,
          status: jobSkill.userProgress?.status || 'not_started',
          score: jobSkill.userProgress?.score,
          startedAt: jobSkill.userProgress?.startedAt,
          completedAt: jobSkill.userProgress?.completedAt,
          evaluatedAt: jobSkill.userProgress?.evaluatedAt,
          evaluationRequestedAt: jobSkill.userProgress?.evaluationRequestedAt,
          attempts: jobSkill.userProgress?.attempts || 0,
          jobLevel: job.name,
          Skill: jobSkill.Skill
        },
        x,
        y,
        connections,
        category: category,
        jobLevel,
        unlocked: jobLevel <= getCurrentJobLevel(jobProgression) + 1, // Allow one level ahead
        prerequisitesMet
      })
    })
  })
  
  return nodes
}

/**
 * Get category index for positioning
 */
const getCategoryIndex = (category: string): number => {
  const categories = ['山恩DNA', '產品知識', '工具使用', '安裝知識', '安全操作']
  const index = categories.indexOf(category)
  return index >= 0 ? index : 5
}

/**
 * Get current job level from progression
 */
const getCurrentJobLevel = (jobProgression: any[]): number => {
  const currentJob = jobProgression.find(job => job.isCurrentJob)
  return currentJob?.level || 1
}

/**
 * Calculate learning path suggestions with dependency awareness
 */
export const suggestLearningPath = (
  userSkills: any[],
  jobProgression: any[],
  dependencies: SkillDependency[]
): {
  nextSkills: any[]
  prioritySkills: any[]
  optionalSkills: any[]
  blockedSkills: any[]
} => {
  const completedSkillIds = userSkills
    .filter(skill => skill.status === 'completed' && skill.score >= 60)
    .map(skill => skill.skillId)
  
  const inProgressSkills = userSkills.filter(skill => 
    skill.status === 'in_progress'
  )
  
  const notStartedSkills = userSkills.filter(skill => 
    skill.status === 'not_started'
  )
  
  // Find current job level
  const currentJob = jobProgression.find((job: any) => job.isCurrentJob)
  const currentJobLevel = currentJob?.level || 1
  
  // Categorize skills based on dependencies
  const availableSkills = notStartedSkills.filter(skill => {
    const dependency = dependencies.find(d => d.skillId === skill.skillId)
    return dependency?.isUnlocked(completedSkillIds) ?? true
  })
  
  const blockedSkills = notStartedSkills.filter(skill => {
    const dependency = dependencies.find(d => d.skillId === skill.skillId)
    return !(dependency?.isUnlocked(completedSkillIds) ?? true)
  })
  
  // Priority: current job required skills that are available
  const prioritySkills = availableSkills
    .filter(skill => {
      const dependency = dependencies.find(d => d.skillId === skill.skillId)
      return dependency?.jobLevel === currentJobLevel && dependency?.isRequired
    })
  
  // Next: current job optional skills or next level required skills
  const nextSkills = availableSkills
    .filter(skill => {
      const dependency = dependencies.find(d => d.skillId === skill.skillId)
      return (dependency?.jobLevel === currentJobLevel && !dependency?.isRequired) ||
             (dependency?.jobLevel === currentJobLevel + 1 && dependency?.isRequired)
    })
    .slice(0, 5)
  
  // Optional: remaining available skills
  const optionalSkills = availableSkills
    .filter(skill => !prioritySkills.includes(skill) && !nextSkills.includes(skill))
    .slice(0, 10)
  
  return {
    nextSkills,
    prioritySkills,
    optionalSkills,
    blockedSkills
  }
}