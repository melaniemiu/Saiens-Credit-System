import { API_CONFIG } from '@/config/api-config'
import { mockApi } from './api-mock'
import { mockSkillCategories } from './mock-data'
import {
  authApi,
  userApi,
  creditApi,
  departmentApi,
  skillApi,
  skillCategoryApi,
  adminApi,
  jobApi,
  promotionApi,
  csvApi
} from './api'

// Unified API client interface
export interface ApiClient {
  // Authentication
  login: typeof authApi.lineLogin
  bindEmployee: typeof authApi.bindEmployeeId
  logout: typeof mockApi.logout
  
  // User management
  getCurrentUser: typeof userApi.getCurrentUser
  getDailyStats: typeof userApi.getDailyStats
  getUsersList: typeof userApi.getUsers
  getAllUsers: typeof userApi.getAllUsers
  createUser: typeof userApi.createUser
  updateUser: typeof userApi.updateUser
  deleteUser: typeof userApi.deleteUser
  
  // Credit management
  giveCredit: typeof creditApi.giveCredit
  giveBulkCredit: typeof creditApi.giveBulkCredit
  getReceivedCredits: typeof creditApi.getReceivedCredits
  getSentCredits: typeof creditApi.getSentCredits
  getAllCredits: typeof creditApi.getAllCredits
  
  // Skills management
  getUserSkills: typeof skillApi.getUserSkills
  getJobSkills: typeof skillApi.getJobSkills
  getDepartmentProgression: typeof skillApi.getDepartmentProgression
  getSuggestedSkills: typeof skillApi.getSuggestedSkills
  getSkillStats: typeof skillApi.getSkillStats
  updateSkillProgress: typeof skillApi.updateSkillProgress
  requestEvaluation: typeof skillApi.requestEvaluation
  submitEvaluationByUserSkillId: typeof skillApi.submitEvaluationByUserSkillId
  getEvaluationDetailsByUserSkillId: typeof skillApi.getEvaluationDetailsByUserSkillId
  getPendingEvaluations: typeof skillApi.getPendingEvaluations
  getAdminSkills: typeof skillApi.getAdminSkills
  createSkill: typeof skillApi.createSkill
  updateSkill: typeof skillApi.updateSkill
  deleteSkill: typeof skillApi.deleteSkill
  
  // Skill Categories management
  getSkillCategories: typeof skillCategoryApi.getSkillCategories
  getSkillCategoryById: typeof skillCategoryApi.getSkillCategoryById
  createSkillCategory: typeof skillCategoryApi.createSkillCategory
  getOrCreateSkillCategory: typeof skillCategoryApi.getOrCreateSkillCategory
  updateSkillCategory: typeof skillCategoryApi.updateSkillCategory
  deleteSkillCategory: typeof skillCategoryApi.deleteSkillCategory
  
  // Department management
  getDepartments: typeof departmentApi.getDepartments
  getAdminDepartments: typeof departmentApi.getAdminDepartments
  createDepartment: typeof departmentApi.createDepartment
  updateDepartment: typeof departmentApi.updateDepartment
  deleteDepartment: typeof departmentApi.deleteDepartment
  
  // Admin endpoints
  getAdminUsers: typeof adminApi.getUsers
  createAdminUser: typeof adminApi.createUser
  updateAdminUser: typeof adminApi.updateUser
  deleteAdminUser: typeof adminApi.deleteUser
  getAdminCredits: typeof adminApi.getCredits
  exportCredits: typeof adminApi.exportCredits
  getJobsForDepartment: typeof adminApi.getJobsForDepartment
  
  // Job management
  getAdminJobs: typeof jobApi.getAdminJobs
  createJob: typeof jobApi.createJob
  updateJob: typeof jobApi.updateJob
  deleteJob: typeof jobApi.deleteJob
  
  // User promotion
  checkUserPromotion: typeof promotionApi.checkUserPromotion
  promoteUser: typeof promotionApi.promoteUser
  
  // CSV operations
  importUsers: typeof csvApi.importUsers
  importSkills: typeof csvApi.importSkills
  importDepartments: typeof csvApi.importDepartments
  importJobs: typeof csvApi.importJobs
  downloadExample: typeof csvApi.downloadExample
}

// Mock API client adapter (converts mock responses to match real API format)
const createMockApiClient = (): ApiClient => ({
  // Authentication
  login: async (lineToken: string) => {
    const result = await mockApi.login(lineToken)
    return {
      data: {
        token: result.token,
        user: result.user
      },
      status: 200
    }
  },
  
  bindEmployee: async (employeeId: string, lineUserId: string, profilePicture?: string | null) => {
    const result = await mockApi.bindEmployee({ employeeId, name: 'Mock User' })
    return {
      data: {
        token: 'mock-token',
        user: result.user
      },
      status: 200
    }
  },
  
  logout: async () => {
    await mockApi.logout()
    return {
      data: undefined,
      status: 200
    }
  },
  
  // User management
  getCurrentUser: async (bypassCache: boolean = false) => {
    const user = await mockApi.getCurrentUser()
    return {
      data: { user },
      status: 200
    }
  },
  
  getDailyStats: async () => {
    const stats = await mockApi.getDailyStats()
    return {
      data: { stats },
      status: 200
    }
  },
  
  getUsersList: async (departmentId?: string, searchTerm?: string) => {
    const users = await mockApi.getUsersList({ 
      search: searchTerm, 
      departmentId,
      limit: 20 
    })
    return {
      data: { users },
      status: 200
    }
  },
  
  getAllUsers: async (page = 1, limit = 20, departmentId?: string, searchTerm?: string, role?: string) => {
    const result = await mockApi.getAdminUsers({
      page,
      limit,
      search: searchTerm,
      departmentId,
      role
    })
    return {
      data: {
        totalItems: result.pagination.total,
        totalPages: result.pagination.totalPages,
        currentPage: result.pagination.page,
        items: result.items
      },
      status: 200
    }
  },
  
  createUser: async (userData: any) => {
    // Mock implementation - would need to extend mockApi for this
    return {
      data: { message: 'User created', user: userData },
      status: 200
    }
  },
  
  updateUser: async (id: string, userData: any) => {
    // Mock implementation - would need to extend mockApi for this
    return {
      data: { message: 'User updated', user: userData },
      status: 200
    }
  },
  
  deleteUser: async (id: string) => {
    // Mock implementation - would need to extend mockApi for this
    return {
      data: { message: 'User deleted' },
      status: 200
    }
  },
  
  // Credit management
  giveCredit: async (receiverId: string, reason: string) => {
    const result = await mockApi.giveCredit({ receiverId, amount: 1, reason })
    return {
      data: {
        message: result.message,
        credit: result.credit,
        remainingCredits: 10 // Mock value
      },
      status: 200
    }
  },
  
  giveBulkCredit: async (receiverIds: string[], reason: string) => {
    const result = await mockApi.bulkGiveCredit({ receiverIds, amount: 1, reason })
    return {
      data: {
        message: result.message,
        creditsCreated: result.credits.length,
        remainingCredits: 10, // Mock value
        credits: result.credits
      },
      status: 200
    }
  },
  
  getReceivedCredits: async (page = 1, limit = 10) => {
    const result = await mockApi.getReceivedCredits({ page, limit })
    return {
      data: {
        totalItems: result.pagination.total,
        totalPages: result.pagination.totalPages,
        currentPage: result.pagination.page,
        credits: result.items
      },
      status: 200
    }
  },
  
  getSentCredits: async (page = 1, limit = 10) => {
    const result = await mockApi.getSentCredits({ page, limit })
    return {
      data: {
        totalItems: result.pagination.total,
        totalPages: result.pagination.totalPages,
        currentPage: result.pagination.page,
        credits: result.items
      },
      status: 200
    }
  },
  
  getAllCredits: async (page = 1, limit = 20, departmentId?: string, startDate?: string, endDate?: string, searchTerm?: string) => {
    const result = await mockApi.getAdminCredits({
      page,
      limit,
      departmentId,
      startDate,
      endDate,
      search: searchTerm
    })
    // Return exactly the same format as real API: ApiResponse<PaginatedResponse<any>>
    return {
      data: {
        totalItems: result.pagination.total,
        totalPages: result.pagination.totalPages,
        currentPage: result.pagination.page,
        items: result.items
      },
      status: 200
    }
  },
  
  // Skills management
  getUserSkills: async (bypassCache: boolean = false) => {
    const userSkills = await mockApi.getUserSkills()
    // Transform mock data to match real API format
    const transformedUserSkills = userSkills.map((us: any) => ({
      ...us,
      Skill: us.skill ? {
        id: us.skill.id,
        name: us.skill.name,
        category: us.skill.category,
        isRequired: us.skill.isRequired,
        learningMethod: us.skill.learningMethod,
        assessmentMethod: us.skill.assessmentMethod,
        syllabus: us.skill.syllabus
      } : null
    }))
    return {
      data: { userSkills: transformedUserSkills },
      status: 200
    }
  },
  
  getJobSkills: async (bypassCache: boolean = false) => {
    const jobSkills = await mockApi.getJobSkills()
    // Transform mock data to match real API format
    const transformedJobSkills = jobSkills.map((js: any) => ({
      ...js,
      Skill: js.skill ? {
        id: js.skill.id,
        name: js.skill.name,
        category: js.skill.category,
        isRequired: js.skill.isRequired,
        learningMethod: js.skill.learningMethod,
        assessmentMethod: js.skill.assessmentMethod,
        syllabus: js.skill.syllabus
      } : null
    }))
    return {
      data: {
        job: { id: 'mock-job-1', name: 'Mock Job' },
        skillsWithProgress: transformedJobSkills
      },
      status: 200
    }
  },
  
  getDepartmentProgression: async (bypassCache: boolean = false) => {
    const result = await mockApi.getDepartmentProgression()
    return {
      data: result,
      status: 200
    }
  },
  
  getSuggestedSkills: async () => {
    const suggestedSkills = await mockApi.getSuggestedSkills()
    return {
      data: {
        nextJob: { id: 'mock-job-2', title: 'Next Job' },
        suggestedSkills
      },
      status: 200
    }
  },
  
  getSkillStats: async () => {
    // Mock implementation
    return {
      data: {
        skillStats: {},
        total: 20,
        completed: 10,
        completionPercentage: 50
      },
      status: 200
    }
  },
  
  updateSkillProgress: async (skillId: string, data: any) => {
    const result = await mockApi.updateSkillProgress(skillId, data)
    return {
      data: {
        message: result.message,
        userSkill: {}
      },
      status: 200
    }
  },
  
  // Department management
  getDepartments: async () => {
    const departments = await mockApi.getDepartments()
    return {
      data: { departments },
      status: 200
    }
  },
  
  // Skills evaluation and admin
  requestEvaluation: async (skillId: string) => ({ data: { message: 'Mock evaluation requested', evaluationRequest: {} }, status: 200 }),
  submitEvaluationByUserSkillId: async (userSkillId: string, evaluationData: any) => ({ data: { message: 'Mock evaluation submitted', userSkill: {} }, status: 200 }),
  getEvaluationDetailsByUserSkillId: async (userSkillId: string) => ({ data: { skill: {}, userSkill: {}, user: {} }, status: 200 }),
  getPendingEvaluations: async (params: any) => {
    const result = await mockApi.getPendingEvaluations(params)
    return {
      data: {
        evaluations: result.items,
        pagination: {
          currentPage: result.pagination.page,
          totalPages: result.pagination.totalPages,
          totalItems: result.pagination.total,
          itemsPerPage: result.pagination.limit
        }
      },
      status: 200
    }
  },
  getAdminSkills: async (params: any = {}) => {
    const result = await mockApi.getAdminSkills({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search,
      category: params.category,
      sortField: params.sortField || 'name',
      sortOrder: params.sortOrder || 'ASC'
    })
    return {
      data: {
        skills: result.items,
        pagination: result.pagination,
        categories: result.categories
      },
      status: 200
    }
  },
  createSkill: async (data: any) => ({ data: { message: 'Mock skill created', skill: data }, status: 200 }),
  updateSkill: async (id: string, data: any) => ({ data: { message: 'Mock skill updated', skill: data }, status: 200 }),
  deleteSkill: async (id: string) => ({ data: { message: 'Mock skill deleted' }, status: 200 }),
  
  // Skill Categories management
  getSkillCategories: async (params: any = {}) => {
    const result = await mockApi.getSkillCategories(params)
    return {
      data: result,
      status: 200
    }
  },
  getSkillCategoryById: async (id: string) => {
    const category = mockSkillCategories.find(c => c.id === id)
    return {
      data: { category },
      status: 200
    }
  },
  createSkillCategory: async (data: any) => {
    const result = await mockApi.createSkillCategory(data)
    return {
      data: result,
      status: 201
    }
  },
  updateSkillCategory: async (id: string, data: any) => {
    const result = await mockApi.updateSkillCategory(id, data)
    return {
      data: result,
      status: 200
    }
  },
  deleteSkillCategory: async (id: string) => {
    const result = await mockApi.deleteSkillCategory(id)
    return {
      data: result,
      status: 200
    }
  },
  getOrCreateSkillCategory: async (data: any) => {
    const result = await mockApi.getOrCreateSkillCategory(data)
    return {
      data: result,
      status: 200
    }
  },

  getAdminDepartments: async (page = 1, limit = 10, search?: string, sortField = 'name', sortOrder = 'ASC') => {
    const result = await mockApi.getAdminDepartments({
      page,
      limit,
      search,
      sortField,
      sortOrder
    })
    return {
      data: {
        departments: result.items,
        pagination: {
          total: result.pagination.total,
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.totalPages
        }
      },
      status: 200
    }
  },
  createDepartment: async (data: any) => ({ data: { message: 'Mock department created', department: data }, status: 200 }),
  updateDepartment: async (id: string, data: any) => ({ data: { message: 'Mock department updated', department: data }, status: 200 }),
  deleteDepartment: async (id: string) => ({ data: { message: 'Mock department deleted' }, status: 200 }),
  getAdminUsers: async (params: any) => {
    const result = await mockApi.getAdminUsers(params)
    return {
      data: {
        users: result.items,
        totalPages: result.pagination.totalPages,
        currentPage: result.pagination.page,
        totalCount: result.pagination.total
      },
      status: 200
    }
  },
  createAdminUser: async (userData: any) => ({ data: { message: 'Mock admin user created', user: userData }, status: 200 }),
  updateAdminUser: async (userId: string, userData: any) => ({ data: { message: 'Mock admin user updated', user: userData }, status: 200 }),
  deleteAdminUser: async (userId: string) => ({ data: { message: 'Mock admin user deleted' }, status: 200 }),
  getAdminCredits: async (params: any) => {
    const result = await mockApi.getAdminCredits(params)
    return {
      data: {
        credits: result.items,
        totalPages: result.pagination.totalPages,
        currentPage: result.pagination.page,
        totalCount: result.pagination.total
      },
      status: 200
    }
  },
  exportCredits: async (params: any) => ({ data: 'Mock CSV data', status: 200 }),
  getJobsForDepartment: async (departmentId: string) => ({ data: { jobs: [] }, status: 200 }),
  getAdminJobs: async (page = 1, limit = 10, search?: string, departmentId?: string, sortField = 'name', sortOrder = 'ASC') => {
    const result = await mockApi.getAdminJobs({
      page,
      limit,
      search,
      departmentId,
      sortField,
      sortOrder
    })
    return {
      data: {
        jobs: result.items,
        pagination: {
          currentPage: result.pagination.page,
          totalPages: result.pagination.totalPages,
          totalItems: result.pagination.total,
          itemsPerPage: result.pagination.limit
        }
      },
      status: 200
    }
  },
  createJob: async (data: any) => ({ data: { message: 'Mock job created', job: data }, status: 200 }),
  updateJob: async (id: string, data: any) => ({ data: { message: 'Mock job updated', job: data }, status: 200 }),
  deleteJob: async (id: string) => ({ data: { message: 'Mock job deleted' }, status: 200 }),
  checkUserPromotion: async (userId: string) => ({ data: { canPromote: false, currentJob: { id: 'job-1', name: 'Mock Job' }, requiredSkills: [], completedSkills: [] }, status: 200 }),
  promoteUser: async (userId: string) => ({ data: { message: 'Mock user promoted', user: { id: userId, name: 'Mock User', employeeId: 'EMP001', previousJob: 'Old Job', newJob: 'New Job' } }, status: 200 }),
  importUsers: async (file: File) => ({ data: { message: 'Mock users imported' }, status: 200 }),
  importSkills: async (file: File) => ({ data: { message: 'Mock skills imported' }, status: 200 }),
  importDepartments: async (file: File) => ({ data: { message: 'Mock departments imported' }, status: 200 }),
  importJobs: async (file: File) => ({ data: { message: 'Mock jobs imported' }, status: 200 }),
  downloadExample: async (type: string) => { console.log('Mock CSV download:', type) }
})

// Real API client adapter (uses existing API functions)
const createRealApiClient = (): ApiClient => ({
  // Authentication
  login: authApi.lineLogin,
  bindEmployee: authApi.bindEmployeeId,
  logout: async () => ({ data: undefined, status: 200 }),
  
  // User management
  getCurrentUser: userApi.getCurrentUser,
  getDailyStats: userApi.getDailyStats,
  getUsersList: userApi.getUsers,
  getAllUsers: userApi.getAllUsers,
  createUser: userApi.createUser,
  updateUser: userApi.updateUser,
  deleteUser: userApi.deleteUser,
  
  // Credit management
  giveCredit: creditApi.giveCredit,
  giveBulkCredit: creditApi.giveBulkCredit,
  getReceivedCredits: creditApi.getReceivedCredits,
  getSentCredits: creditApi.getSentCredits,
  getAllCredits: creditApi.getAllCredits,
  
  // Skills management
  getUserSkills: skillApi.getUserSkills,
  getJobSkills: skillApi.getJobSkills,
  getDepartmentProgression: skillApi.getDepartmentProgression,
  getSuggestedSkills: skillApi.getSuggestedSkills,
  getSkillStats: skillApi.getSkillStats,
  updateSkillProgress: skillApi.updateSkillProgress,
  requestEvaluation: skillApi.requestEvaluation,
  submitEvaluationByUserSkillId: skillApi.submitEvaluationByUserSkillId,
  getEvaluationDetailsByUserSkillId: skillApi.getEvaluationDetailsByUserSkillId,
  getPendingEvaluations: skillApi.getPendingEvaluations,
  getAdminSkills: skillApi.getAdminSkills,
  createSkill: skillApi.createSkill,
  updateSkill: skillApi.updateSkill,
  deleteSkill: skillApi.deleteSkill,
  
  // Skill Categories management
  getSkillCategories: skillCategoryApi.getSkillCategories,
  getSkillCategoryById: skillCategoryApi.getSkillCategoryById,
  createSkillCategory: skillCategoryApi.createSkillCategory,
  getOrCreateSkillCategory: skillCategoryApi.getOrCreateSkillCategory,
  updateSkillCategory: skillCategoryApi.updateSkillCategory,
  deleteSkillCategory: skillCategoryApi.deleteSkillCategory,
  
  // Department management
  getDepartments: departmentApi.getDepartments,
  getAdminDepartments: departmentApi.getAdminDepartments,
  createDepartment: departmentApi.createDepartment,
  updateDepartment: departmentApi.updateDepartment,
  deleteDepartment: departmentApi.deleteDepartment,
  
  // Admin endpoints
  getAdminUsers: adminApi.getUsers,
  createAdminUser: adminApi.createUser,
  updateAdminUser: adminApi.updateUser,
  deleteAdminUser: adminApi.deleteUser,
  getAdminCredits: adminApi.getCredits,
  exportCredits: adminApi.exportCredits,
  getJobsForDepartment: adminApi.getJobsForDepartment,
  
  // Job management
  getAdminJobs: jobApi.getAdminJobs,
  createJob: jobApi.createJob,
  updateJob: jobApi.updateJob,
  deleteJob: jobApi.deleteJob,
  
  // User promotion
  checkUserPromotion: promotionApi.checkUserPromotion,
  promoteUser: promotionApi.promoteUser,
  
  // CSV operations
  importUsers: csvApi.importUsers,
  importSkills: csvApi.importSkills,
  importDepartments: csvApi.importDepartments,
  importJobs: csvApi.importJobs,
  downloadExample: csvApi.downloadExample
})

// Create and export the unified API client
export const apiClient: ApiClient = API_CONFIG.useMockApi 
  ? createMockApiClient() 
  : createRealApiClient()

// Log the current API mode
if (typeof window !== 'undefined' && API_CONFIG.enableMockLogs) {
  console.log(`🎭 API Client initialized in ${API_CONFIG.useMockApi ? 'MOCK' : 'REAL'} mode`)
}

// Export the client as default
export default apiClient