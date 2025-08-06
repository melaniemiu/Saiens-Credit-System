import { API_CONFIG, MOCK_CONFIG } from '@/config/api-config'
import {
  mockUsers,
  mockSkills,
  mockSkillCategories,
  mockSkillPrerequisites,
  mockUserSkills,
  mockCredits,
  mockDepartments,
  mockJobs,
  mockJobSkills,
  getUserWithRelations,
  getSkillsWithProgress,
  getJobSkillsWithDetails,
  getCreditsWithUsers,
  getDepartmentJobProgression,
  type MockUser,
  type MockCredit,
  type MockUserSkill,
  type MockSkill,
  type MockSkillCategory,
  type MockSkillPrerequisite,
  type MockDepartment,
  type MockJob
} from './mock-data'

// Mock state management
class MockState {
  private state: {
    users: MockUser[]
    credits: MockCredit[]
    userSkills: MockUserSkill[]
    currentUserId: string
    isAuthenticated: boolean
  }

  constructor() {
    this.state = {
      users: [...mockUsers],
      credits: [...mockCredits],
      userSkills: [...mockUserSkills],
      currentUserId: MOCK_CONFIG.currentUserId,
      isAuthenticated: true // Auto-authenticate in mock mode
    }

    if (API_CONFIG.persistMockState && typeof window !== 'undefined') {
      this.loadState()
    }
  }

  private saveState() {
    if (API_CONFIG.persistMockState && typeof window !== 'undefined') {
      localStorage.setItem('mockApiState', JSON.stringify(this.state))
    }
  }

  private loadState() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mockApiState')
      if (saved) {
        try {
          this.state = { ...this.state, ...JSON.parse(saved) }
        } catch (e) {
          console.warn('Failed to load mock state:', e)
        }
      }
    }
  }

  getState() {
    return this.state
  }

  updateUser(userId: string, updates: Partial<MockUser>) {
    this.state.users = this.state.users.map(user =>
      user.id === userId ? { ...user, ...updates, updatedAt: new Date().toISOString() } : user
    )
    this.saveState()
  }

  addCredit(credit: Omit<MockCredit, 'id' | 'createdAt' | 'updatedAt'>) {
    const newCredit: MockCredit = {
      ...credit,
      id: `mock-credit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.state.credits.unshift(newCredit)
    this.saveState()
    return newCredit
  }

  updateUserSkill(userId: string, skillId: string, updates: Partial<MockUserSkill>) {
    this.state.userSkills = this.state.userSkills.map(us =>
      us.userId === userId && us.skillId === skillId
        ? { ...us, ...updates, updatedAt: new Date().toISOString() }
        : us
    )
    this.saveState()
  }

  login(userId: string) {
    this.state.isAuthenticated = true
    this.state.currentUserId = userId
    this.saveState()
  }

  logout() {
    this.state.isAuthenticated = false
    this.saveState()
  }

  reset() {
    this.state = {
      users: [...mockUsers],
      credits: [...mockCredits],
      userSkills: [...mockUserSkills],
      currentUserId: MOCK_CONFIG.currentUserId,
      isAuthenticated: false
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockApiState')
    }
  }
}

const mockState = new MockState()

// Utility functions
const delay = async () => {
  const ms = Math.random() * (API_CONFIG.mockDelay.max - API_CONFIG.mockDelay.min) + API_CONFIG.mockDelay.min
  await new Promise(resolve => setTimeout(resolve, ms))
}

const log = (message: string, data?: any) => {
  if (API_CONFIG.enableMockLogs) {
    console.log(`🎭 Mock API: ${message}`, data)
  }
}

const simulateError = (errorRate: number = 0.05) => {
  if (API_CONFIG.mockErrors && Math.random() < errorRate) {
    throw new Error('Mock API Error: Simulated network failure')
  }
}

const paginate = <T>(items: T[], page: number = 1, limit: number = API_CONFIG.defaultPageSize) => {
  const offset = (page - 1) * limit
  const paginatedItems = items.slice(offset, offset + limit)
  
  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasNext: offset + limit < items.length,
      hasPrev: page > 1
    }
  }
}

// Mock API implementation
export const mockApi = {
  // Authentication
  async login(lineToken: string) {
    await delay()
    simulateError()
    log('Login attempt', { lineToken })

    // Simulate LINE token validation
    if (!lineToken || lineToken.length < 10) {
      throw new Error('Invalid LINE token')
    }

    const currentUser = getUserWithRelations(MOCK_CONFIG.currentUserId)
    if (!currentUser) {
      throw new Error('User not found')
    }

    mockState.login(currentUser.id)

    const token = `mock-jwt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      success: true,
      message: 'Login successful',
      user: currentUser,
      token
    }
  },

  async bindEmployee(data: { employeeId: string; name: string }) {
    await delay()
    simulateError()
    log('Bind employee', data)

    const state = mockState.getState()
    const existingUser = state.users.find(u => u.employeeId === data.employeeId)
    
    if (!existingUser) {
      throw new Error('Employee ID not found')
    }

    mockState.updateUser(existingUser.id, {
      name: data.name,
      profilePicture: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`
    })

    return {
      success: true,
      message: 'Employee binding successful',
      user: getUserWithRelations(existingUser.id)
    }
  },

  async logout() {
    await delay()
    log('Logout')
    mockState.logout()
    return { success: true, message: 'Logout successful' }
  },

  // User management
  async getCurrentUser() {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    if (!state.isAuthenticated) {
      throw new Error('Not authenticated')
    }

    const user = getUserWithRelations(state.currentUserId)
    if (!user) {
      throw new Error('User not found')
    }

    log('Get current user', user)
    return user
  },

  async getDailyStats() {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    const user = state.users.find(u => u.id === state.currentUserId)
    if (!user) {
      throw new Error('User not found')
    }

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const dayBefore = new Date(today)
    dayBefore.setDate(dayBefore.getDate() - 2)

    const todayCredits = state.credits.filter(c => 
      (c.senderId === user.id || c.receiverId === user.id) &&
      new Date(c.createdAt).toDateString() === today.toDateString()
    )

    const yesterdayCredits = state.credits.filter(c => 
      (c.senderId === user.id || c.receiverId === user.id) &&
      new Date(c.createdAt).toDateString() === yesterday.toDateString()
    )

    const dayBeforeCredits = state.credits.filter(c => 
      (c.senderId === user.id || c.receiverId === user.id) &&
      new Date(c.createdAt).toDateString() === dayBefore.toDateString()
    )

    const stats = {
      today: {
        sent: todayCredits.filter(c => c.senderId === user.id).reduce((sum, c) => sum + c.amount, 0),
        received: todayCredits.filter(c => c.receiverId === user.id).reduce((sum, c) => sum + c.amount, 0)
      },
      yesterday: {
        sent: yesterdayCredits.filter(c => c.senderId === user.id).reduce((sum, c) => sum + c.amount, 0),
        received: yesterdayCredits.filter(c => c.receiverId === user.id).reduce((sum, c) => sum + c.amount, 0)
      },
      dayBefore: {
        sent: dayBeforeCredits.filter(c => c.senderId === user.id).reduce((sum, c) => sum + c.amount, 0),
        received: dayBeforeCredits.filter(c => c.receiverId === user.id).reduce((sum, c) => sum + c.amount, 0)
      },
      remainingDailyCredits: user.remainingDailyCredits,
      dailyCreditsLimit: user.dailyCreditsLimit
    }

    log('Get daily stats', stats)
    return stats
  },

  async getUsersList(params: { search?: string; departmentId?: string; limit?: number }) {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    let users = state.users.filter(u => u.id !== state.currentUserId)

    if (params.search) {
      const search = params.search.toLowerCase()
      users = users.filter(u => 
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.employeeId.toLowerCase().includes(search)
      )
    }

    if (params.departmentId) {
      users = users.filter(u => u.departmentId === params.departmentId)
    }

    const limit = Math.min(params.limit || 20, 50)
    const result = users.slice(0, limit).map(u => getUserWithRelations(u.id)!)

    log('Get users list', { params, count: result.length })
    return result
  },

  // Credit management
  async giveCredit(data: { receiverId: string; amount: number; reason?: string }) {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    const sender = state.users.find(u => u.id === state.currentUserId)
    const receiver = state.users.find(u => u.id === data.receiverId)

    if (!sender || !receiver) {
      throw new Error('User not found')
    }

    if (sender.remainingDailyCredits < data.amount) {
      throw new Error('Insufficient daily credits')
    }

    // Update sender's remaining credits
    mockState.updateUser(sender.id, {
      remainingDailyCredits: sender.remainingDailyCredits - data.amount,
      creditsSent: sender.creditsSent + data.amount
    })

    // Update receiver's credits
    mockState.updateUser(receiver.id, {
      creditsReceived: receiver.creditsReceived + data.amount
    })

    // Add credit transaction
    const credit = mockState.addCredit({
      senderId: sender.id,
      receiverId: receiver.id,
      amount: data.amount,
      reason: data.reason || null
    })

    log('Give credit', { data, credit })
    return { success: true, message: 'Credit given successfully', credit }
  },

  async bulkGiveCredit(data: { receiverIds: string[]; amount: number; reason?: string }) {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    const sender = state.users.find(u => u.id === state.currentUserId)

    if (!sender) {
      throw new Error('Sender not found')
    }

    const totalAmount = data.amount * data.receiverIds.length
    if (sender.remainingDailyCredits < totalAmount) {
      throw new Error('Insufficient daily credits')
    }

    const credits = []
    for (const receiverId of data.receiverIds) {
      const receiver = state.users.find(u => u.id === receiverId)
      if (receiver) {
        mockState.updateUser(receiver.id, {
          creditsReceived: receiver.creditsReceived + data.amount
        })

        const credit = mockState.addCredit({
          senderId: sender.id,
          receiverId,
          amount: data.amount,
          reason: data.reason || null
        })
        credits.push(credit)
      }
    }

    mockState.updateUser(sender.id, {
      remainingDailyCredits: sender.remainingDailyCredits - totalAmount,
      creditsSent: sender.creditsSent + totalAmount
    })

    log('Bulk give credit', { data, creditsCreated: credits.length })
    return { success: true, message: 'Credits given successfully', credits }
  },

  async getReceivedCredits(params: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string }) {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    let credits = state.credits.filter(c => c.receiverId === state.currentUserId)

    // Apply filters
    if (params.search) {
      const search = params.search.toLowerCase()
      credits = credits.filter(c => {
        const sender = state.users.find(u => u.id === c.senderId)
        return sender?.name.toLowerCase().includes(search) ||
               c.reason?.toLowerCase().includes(search)
      })
    }

    if (params.startDate) {
      credits = credits.filter(c => c.createdAt >= params.startDate!)
    }

    if (params.endDate) {
      credits = credits.filter(c => c.createdAt <= params.endDate!)
    }

    const result = paginate(
      getCreditsWithUsers(credits),
      params.page,
      params.limit
    )

    log('Get received credits', { params, total: result.pagination.total })
    return result
  },

  async getSentCredits(params: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string }) {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    let credits = state.credits.filter(c => c.senderId === state.currentUserId)

    // Apply filters (same as received credits)
    if (params.search) {
      const search = params.search.toLowerCase()
      credits = credits.filter(c => {
        const receiver = state.users.find(u => u.id === c.receiverId)
        return receiver?.name.toLowerCase().includes(search) ||
               c.reason?.toLowerCase().includes(search)
      })
    }

    if (params.startDate) {
      credits = credits.filter(c => c.createdAt >= params.startDate!)
    }

    if (params.endDate) {
      credits = credits.filter(c => c.createdAt <= params.endDate!)
    }

    const result = paginate(
      getCreditsWithUsers(credits),
      params.page,
      params.limit
    )

    log('Get sent credits', { params, total: result.pagination.total })
    return result
  },

  // Skills management
  async getUserSkills() {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    const userSkills = getSkillsWithProgress(state.currentUserId)
    
    log('Get user skills', { count: userSkills.length })
    return userSkills
  },

  async getJobSkills() {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    const user = state.users.find(u => u.id === state.currentUserId)
    
    if (!user) {
      throw new Error('User not found')
    }

    const jobSkills = getJobSkillsWithDetails(user.jobId)
    
    log('Get job skills', { jobId: user.jobId, count: jobSkills.length })
    return jobSkills
  },

  async getSuggestedSkills() {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    const user = state.users.find(u => u.id === state.currentUserId)
    
    if (!user) {
      throw new Error('User not found')
    }

    // Find next job level
    const currentJob = mockJobs.find(j => j.id === user.jobId)
    const nextJob = mockJobs.find(j => 
      j.departmentId === user.departmentId && 
      j.level === (currentJob?.level || 0) + 1
    )

    if (!nextJob) {
      log('Get suggested skills', { message: 'No next job level found' })
      return []
    }

    const nextJobSkills = getJobSkillsWithDetails(nextJob.id)
    const userSkillIds = state.userSkills
      .filter(us => us.userId === state.currentUserId)
      .map(us => us.skillId)

    const suggestedSkills = nextJobSkills
      .filter(js => !userSkillIds.includes(js.skillId))
      .slice(0, 5)

    log('Get suggested skills', { nextJob: nextJob.title, count: suggestedSkills.length })
    return suggestedSkills
  },

  async updateSkillProgress(skillId: string, data: { status?: string; score?: number }) {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    const existingUserSkill = state.userSkills.find(us => 
      us.userId === state.currentUserId && us.skillId === skillId
    )

    if (!existingUserSkill) {
      // Create new user skill
      const newUserSkill = {
        id: `mock-us-${Date.now()}`,
        userId: state.currentUserId,
        skillId,
        status: data.status || 'in_progress',
        score: data.score || null,
        attempts: 1,
        startDate: new Date().toISOString(),
        completionDate: data.status === 'completed' ? new Date().toISOString() : null,
        certificationDate: data.status === 'certified' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      state.userSkills.push(newUserSkill)
    } else {
      mockState.updateUserSkill(state.currentUserId, skillId, {
        status: data.status || existingUserSkill.status,
        score: data.score || existingUserSkill.score,
        attempts: existingUserSkill.attempts + 1,
        completionDate: data.status === 'completed' ? new Date().toISOString() : existingUserSkill.completionDate,
        certificationDate: data.status === 'certified' ? new Date().toISOString() : existingUserSkill.certificationDate
      })
    }

    log('Update skill progress', { skillId, data })
    return { success: true, message: 'Skill progress updated' }
  },

  async getDepartmentProgression() {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    const result = getDepartmentJobProgression(state.currentUserId)
    
    if (!result) {
      throw new Error('User not found')
    }
    
    log('Get department progression', { 
      department: result.department, 
      currentJob: result.currentJob,
      jobCount: result.jobProgression.length 
    })
    return result
  },

  // Department management
  async getDepartments() {
    await delay()
    simulateError()
    
    log('Get departments', { count: mockDepartments.length })
    return mockDepartments
  },

  async getAdminDepartments(params: { page?: number; limit?: number; search?: string; sortField?: string; sortOrder?: string }) {
    await delay()
    simulateError()
    
    let filteredDepts = [...mockDepartments]
    
    // Apply search filter
    if (params.search) {
      const search = params.search.toLowerCase()
      filteredDepts = filteredDepts.filter(dept => 
        dept.name.toLowerCase().includes(search) ||
        (dept.description || '').toLowerCase().includes(search)
      )
    }
    
    // Apply sorting
    const sortField = params.sortField || 'name'
    const sortOrder = params.sortOrder || 'ASC'
    filteredDepts.sort((a, b) => {
      let aVal = a[sortField as keyof typeof a] || ''
      let bVal = b[sortField as keyof typeof b] || ''
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      
      if (sortOrder === 'DESC') {
        return aVal < bVal ? 1 : -1
      }
      return aVal > bVal ? 1 : -1
    })
    
    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 10
    const offset = (page - 1) * limit
    const paginatedDepts = filteredDepts.slice(offset, offset + limit)
    
    // Add additional stats for each department
    const departmentsWithStats = paginatedDepts.map(dept => {
      // Get all jobs for this department
      const departmentJobs = mockJobs.filter(job => job.departmentId === dept.id)
      
      // Get all unique skills across all jobs in this department
      const uniqueSkillIds = new Set<string>()
      departmentJobs.forEach(job => {
        const jobSkills = mockJobSkills.filter(js => js.jobId === job.id)
        jobSkills.forEach(js => uniqueSkillIds.add(js.skillId))
      })
      
      return {
        ...dept,
        isActive: true,
        userCount: mockUsers.filter(u => u.departmentId === dept.id).length,
        skillCount: uniqueSkillIds.size
      }
    })
    
    log('Get admin departments', { 
      total: filteredDepts.length, 
      page, 
      limit,
      returned: departmentsWithStats.length 
    })
    
    return {
      items: departmentsWithStats,
      pagination: {
        page,
        limit,
        total: filteredDepts.length,
        totalPages: Math.ceil(filteredDepts.length / limit)
      }
    }
  },

  async getAdminSkills(params: { page?: number; limit?: number; search?: string; sortField?: string; sortOrder?: string; category?: string }) {
    await delay()
    simulateError()
    
    let filteredSkills = [...mockSkills]
    
    // Apply search filter
    if (params.search) {
      const search = params.search.toLowerCase()
      filteredSkills = filteredSkills.filter(skill => {
        const category = mockSkillCategories.find(c => c.id === skill.categoryId)
        return skill.name.toLowerCase().includes(search) ||
               (category?.name.toLowerCase() || '').includes(search) ||
               (skill.description || '').toLowerCase().includes(search)
      })
    }
    
    // Apply category filter
    if (params.category && params.category !== 'all') {
      filteredSkills = filteredSkills.filter(skill => skill.categoryId === params.category)
    }
    
    // Apply sorting
    const sortField = params.sortField || 'name'
    const sortOrder = params.sortOrder || 'ASC'
    filteredSkills.sort((a, b) => {
      let aVal = a[sortField as keyof typeof a] || ''
      let bVal = b[sortField as keyof typeof b] || ''
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      
      if (sortOrder === 'DESC') {
        return aVal < bVal ? 1 : -1
      }
      return aVal > bVal ? 1 : -1
    })
    
    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 10
    const offset = (page - 1) * limit
    const paginatedSkills = filteredSkills.slice(offset, offset + limit)
    
    // Add additional stats for each skill
    const skillsWithStats = paginatedSkills.map(skill => {
      const category = mockSkillCategories.find(c => c.id === skill.categoryId)
      return {
        ...skill,
        category: category,
        jobCount: mockJobSkills.filter(js => js.skillId === skill.id).length,
        userProgressCount: mockUserSkills.filter(us => us.skillId === skill.id).length,
        completedCount: mockUserSkills.filter(us => us.skillId === skill.id && us.status === 'completed').length
      }
    })
    
    // Get unique categories
    const categories = mockSkillCategories
    
    log('Get admin skills', { 
      total: filteredSkills.length, 
      page, 
      limit,
      returned: skillsWithStats.length,
      categories: categories.length 
    })
    
    return {
      items: skillsWithStats,
      pagination: {
        page,
        limit,
        total: filteredSkills.length,
        totalPages: Math.ceil(filteredSkills.length / limit)
      },
      categories
    }
  },

  // Skill Categories management
  async getSkillCategories(params: { search?: string; isActive?: string; sortField?: string; sortOrder?: string; includeSkillCount?: boolean } = {}) {
    await delay()
    simulateError()
    
    let categories = [...mockSkillCategories]
    
    if (params.search) {
      const search = params.search.toLowerCase()
      categories = categories.filter(c => c.name.toLowerCase().includes(search))
    }
    
    if (params.isActive !== undefined && params.isActive !== '') {
      const isActive = params.isActive === 'true'
      categories = categories.filter(c => c.isActive === isActive)
    }
    
    // Add skill count if requested
    if (params.includeSkillCount) {
      categories = categories.map(cat => ({
        ...cat,
        skillCount: mockSkills.filter(s => s.categoryId === cat.id).length
      }))
    }
    
    log('Get skill categories', { count: categories.length, params })
    return { categories }
  },

  async createSkillCategory(data: { name: string; description?: string; color?: string; icon?: string; sortOrder?: number }) {
    await delay()
    simulateError()
    
    const newCategory: MockSkillCategory = {
      id: `cat-${Date.now()}`,
      name: data.name,
      description: data.description || null,
      color: data.color || '#6B7280',
      icon: data.icon || null,
      sortOrder: data.sortOrder || mockSkillCategories.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    log('Create skill category', { category: newCategory })
    return { category: newCategory }
  },

  async updateSkillCategory(id: string, data: Partial<MockSkillCategory>) {
    await delay()
    simulateError()
    
    const category = mockSkillCategories.find(c => c.id === id)
    if (!category) {
      throw new Error('Skill category not found')
    }
    
    const updatedCategory = { ...category, ...data, updatedAt: new Date().toISOString() }
    log('Update skill category', { id, data })
    return { category: updatedCategory }
  },

  async deleteSkillCategory(id: string) {
    await delay()
    simulateError()
    
    const category = mockSkillCategories.find(c => c.id === id)
    if (!category) {
      throw new Error('Skill category not found')
    }
    
    // Check if category has associated skills
    const associatedSkills = mockSkills.filter(s => s.categoryId === id)
    if (associatedSkills.length > 0) {
      throw new Error(`Cannot delete category. It has ${associatedSkills.length} associated skill(s).`)
    }
    
    log('Delete skill category', { id })
    return { message: 'Skill category deleted successfully' }
  },

  async getOrCreateSkillCategory(data: { name: string }) {
    await delay()
    simulateError()
    
    let category = mockSkillCategories.find(c => c.name === data.name)
    
    if (!category) {
      const result = await this.createSkillCategory({ name: data.name })
      category = result.category
    }
    
    log('Get or create skill category', { name: data.name, category })
    return { category }
  },

  // Skill Prerequisites API
  async getSkillPrerequisites(skillId: string) {
    await delay()
    simulateError()
    
    const prerequisites = mockSkillPrerequisites
      .filter(p => p.skillId === skillId)
      .map(p => {
        const prerequisiteSkill = mockSkills.find(s => s.id === p.prerequisiteSkillId)
        const category = mockSkillCategories.find(c => c.id === prerequisiteSkill?.categoryId)
        return {
          id: p.prerequisiteSkillId,
          name: prerequisiteSkill?.name || '',
          category: category ? { id: category.id, name: category.name, color: category.color } : null,
        }
      })
    
    log('Get skill prerequisites', { skillId, prerequisites })
    return { prerequisites }
  },

  async addSkillPrerequisite(skillId: string, data: { prerequisiteSkillId: string }) {
    await delay()
    simulateError()
    
    // Check if prerequisite already exists
    const existingPrereq = mockSkillPrerequisites.find(p => 
      p.skillId === skillId && p.prerequisiteSkillId === data.prerequisiteSkillId
    )
    
    if (existingPrereq) {
      throw new Error('This prerequisite already exists')
    }
    
    // Check for circular dependencies
    const checkCircular = (currentSkillId: string, targetSkillId: string, visited: Set<string> = new Set()): boolean => {
      if (visited.has(currentSkillId)) return true
      if (currentSkillId === targetSkillId) return true
      
      visited.add(currentSkillId)
      
      const prerequisites = mockSkillPrerequisites.filter(p => p.skillId === currentSkillId)
      for (const prereq of prerequisites) {
        if (checkCircular(prereq.prerequisiteSkillId, targetSkillId, new Set(visited))) {
          return true
        }
      }
      return false
    }
    
    if (checkCircular(data.prerequisiteSkillId, skillId)) {
      throw new Error('This would create a circular dependency')
    }
    
    const newPrerequisite: MockSkillPrerequisite = {
      id: `prereq-${Date.now()}`,
      skillId,
      prerequisiteSkillId: data.prerequisiteSkillId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    mockSkillPrerequisites.push(newPrerequisite)
    
    log('Add skill prerequisite', { skillId, data })
    return { message: 'Prerequisite added successfully' }
  },

  async removeSkillPrerequisite(skillId: string, prerequisiteSkillId: string) {
    await delay()
    simulateError()
    
    const index = mockSkillPrerequisites.findIndex(p => 
      p.skillId === skillId && p.prerequisiteSkillId === prerequisiteSkillId
    )
    
    if (index === -1) {
      throw new Error('Prerequisite not found')
    }
    
    mockSkillPrerequisites.splice(index, 1)
    
    log('Remove skill prerequisite', { skillId, prerequisiteSkillId })
    return { message: 'Prerequisite removed successfully' }
  },

  async getAdminJobs(params: { page?: number; limit?: number; search?: string; sortField?: string; sortOrder?: string; departmentId?: string }) {
    await delay()
    simulateError()
    
    let filteredJobs = [...mockJobs]
    
    // Apply search filter
    if (params.search) {
      const search = params.search.toLowerCase()
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(search) ||
        (job.description || '').toLowerCase().includes(search)
      )
    }
    
    // Apply department filter
    if (params.departmentId && params.departmentId !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.departmentId === params.departmentId)
    }
    
    // Apply sorting
    const sortField = params.sortField || 'title'
    const sortOrder = params.sortOrder || 'ASC'
    filteredJobs.sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a] || ''
      let bVal: any = b[sortField as keyof typeof b] || ''
      
      if (sortField === 'level') {
        aVal = Number(aVal)
        bVal = Number(bVal)
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortOrder === 'DESC') {
        return aVal < bVal ? 1 : -1
      }
      return aVal > bVal ? 1 : -1
    })
    
    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 10
    const offset = (page - 1) * limit
    const paginatedJobs = filteredJobs.slice(offset, offset + limit)
    
    // Add additional stats and relationships for each job
    const jobsWithStats = paginatedJobs.map(job => {
      const department = mockDepartments.find(d => d.id === job.departmentId)
      const jobSkills = mockJobSkills.filter(js => js.jobId === job.id)
      const userCount = mockUsers.filter(u => u.jobId === job.id).length
      
      return {
        ...job,
        name: job.title, // Alias for consistency
        department: department ? { id: department.id, name: department.name } : null,
        skillCount: jobSkills.length,
        userCount,
        skills: jobSkills.map(js => {
          const skill = mockSkills.find(s => s.id === js.skillId)
          return {
            ...js,
            skill: skill ? { id: skill.id, name: skill.name, category: skill.category } : null
          }
        })
      }
    })
    
    console.log('🔍 [JOBS] All jobs:', mockJobs.length)
    console.log('🔍 [JOBS] Filtered jobs:', filteredJobs.length)
    console.log('🔍 [JOBS] Returned jobs:', jobsWithStats.length)
    console.log('🔍 [JOBS] Sample job:', jobsWithStats[0])
    
    log('Get admin jobs', { 
      total: filteredJobs.length, 
      page, 
      limit,
      returned: jobsWithStats.length 
    })
    
    return {
      items: jobsWithStats,
      pagination: {
        page,
        limit,
        total: filteredJobs.length,
        totalPages: Math.ceil(filteredJobs.length / limit)
      }
    }
  },

  async getPendingEvaluations(params: { page?: number; limit?: number; search?: string; departmentId?: string; skillCategory?: string }) {
    await delay()
    simulateError()
    
    // Get user skills that are completed but waiting for evaluation
    const completedSkills = mockUserSkills.filter(us => us.status === 'completed')
    const pendingSkills = completedSkills.filter(us => !us.score || us.score < 60)
    
    console.log('🔍 [EVALUATIONS] Total user skills:', mockUserSkills.length)
    console.log('🔍 [EVALUATIONS] Completed skills:', completedSkills.length)
    console.log('🔍 [EVALUATIONS] Pending evaluation skills:', pendingSkills.length)
    
    let pendingEvaluations = pendingSkills
      .map(us => {
        const user = mockUsers.find(u => u.id === us.userId)
        const skill = mockSkills.find(s => s.id === us.skillId)
        const department = user ? mockDepartments.find(d => d.id === user.departmentId) : null
        
        if (!user || !skill) return null
        
        return {
          id: `eval-${us.id}`,
          userSkillId: us.id,
          userId: user.id,
          userName: user.name,
          userEmployeeId: user.employeeId,
          userDepartment: department?.name || 'Unknown',
          skillId: skill.id,
          skillName: skill.name,
          skillCategory: skill.category,
          learningMethod: skill.learningMethod,
          assessmentMethod: skill.assessmentMethod,
          syllabus: skill.description,
          requestedAt: us.completionDate || us.createdAt,
          evaluationRequestedAt: us.completionDate || us.createdAt || new Date().toISOString(),
          attempts: us.attempts || 1,
          status: 'pending'
        }
      })
      .filter(Boolean) as any[]
    
    // Apply search filter
    if (params.search) {
      const search = params.search.toLowerCase()
      pendingEvaluations = pendingEvaluations.filter(evaluation => 
        evaluation.userName.toLowerCase().includes(search) ||
        evaluation.userEmployeeId.toLowerCase().includes(search) ||
        evaluation.skillName.toLowerCase().includes(search) ||
        evaluation.userDepartment.toLowerCase().includes(search)
      )
    }
    
    // Apply department filter
    if (params.departmentId && params.departmentId !== 'all') {
      const deptName = mockDepartments.find(d => d.id === params.departmentId)?.name
      if (deptName) {
        pendingEvaluations = pendingEvaluations.filter(evaluation => evaluation.userDepartment === deptName)
      }
    }
    
    // Apply skill category filter
    if (params.skillCategory && params.skillCategory !== 'all') {
      pendingEvaluations = pendingEvaluations.filter(evaluation => evaluation.skillCategory === params.skillCategory)
    }
    
    // Apply pagination
    const page = params.page || 1
    const limit = params.limit || 10
    const offset = (page - 1) * limit
    const paginatedEvals = pendingEvaluations.slice(offset, offset + limit)
    
    log('Get pending evaluations', { 
      total: pendingEvaluations.length, 
      page, 
      limit,
      returned: paginatedEvals.length 
    })
    
    return {
      items: paginatedEvals,
      pagination: {
        page,
        limit,
        total: pendingEvaluations.length,
        totalPages: Math.ceil(pendingEvaluations.length / limit)
      }
    }
  },

  // Admin endpoints (simplified)
  async getAdminUsers(params: { page?: number; limit?: number; search?: string; departmentId?: string; role?: string }) {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    let users = state.users

    // Apply filters
    if (params.search) {
      const search = params.search.toLowerCase()
      users = users.filter(u => 
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.employeeId.toLowerCase().includes(search)
      )
    }

    if (params.departmentId) {
      users = users.filter(u => u.departmentId === params.departmentId)
    }

    if (params.role) {
      users = users.filter(u => u.role === params.role)
    }

    const usersWithRelations = users.map(u => getUserWithRelations(u.id)!)
    const result = paginate(usersWithRelations, params.page, params.limit)

    log('Get admin users', { params, total: result.pagination.total })
    return result
  },

  async getAdminCredits(params: { page?: number; limit?: number; search?: string; departmentId?: string; startDate?: string; endDate?: string }) {
    await delay()
    simulateError()
    
    const state = mockState.getState()
    let credits = state.credits

    // Apply filters
    if (params.search) {
      const search = params.search.toLowerCase()
      credits = credits.filter(c => {
        const sender = state.users.find(u => u.id === c.senderId)
        const receiver = state.users.find(u => u.id === c.receiverId)
        return sender?.name.toLowerCase().includes(search) ||
               receiver?.name.toLowerCase().includes(search) ||
               c.reason?.toLowerCase().includes(search)
      })
    }

    if (params.departmentId) {
      credits = credits.filter(c => {
        const sender = state.users.find(u => u.id === c.senderId)
        const receiver = state.users.find(u => u.id === c.receiverId)
        return sender?.departmentId === params.departmentId || receiver?.departmentId === params.departmentId
      })
    }

    if (params.startDate) {
      credits = credits.filter(c => c.createdAt >= params.startDate!)
    }

    if (params.endDate) {
      credits = credits.filter(c => c.createdAt <= params.endDate!)
    }

    const result = paginate(
      getCreditsWithUsers(credits),
      params.page,
      params.limit
    )

    log('Get admin credits', { params, total: result.pagination.total })
    return result
  }
}

// Development utilities
export const mockUtils = {
  reset: () => mockState.reset(),
  getState: () => mockState.getState(),
  setCurrentUser: (userId: string) => {
    const state = mockState.getState()
    state.currentUserId = userId
  },
  login: (userId: string = MOCK_CONFIG.currentUserId) => mockState.login(userId),
  logout: () => mockState.logout()
}