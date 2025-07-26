// API service for communicating with the backend
import { API_URL } from '@/lib/env';
import { apiCache } from '@/lib/cache';
import { API_CONFIG } from '@/config/api-config';

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || API_URL || 'https://ss-backend.unayung.cc/api';

// Interface for API response
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Interface for pagination
interface PaginatedResponse<T> {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  items: T[];
}

// Check if JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    // Mock tokens never expire
    if (token.startsWith('mock-jwt-token-')) {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    if (!payload.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
}

// Create headers with auth token
const createHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      // Check if token is expired before using it
      if (isTokenExpired(token)) {
        console.warn('Auth token is expired, not including in request');
        // Don't clear storage here - let the response handler deal with it
      } else {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      console.warn('No auth token found in storage for API request');
    }
  }

  return headers;
};

// Generic fetch function with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // **PREVENT REAL API CALLS IN MOCK MODE**
  if (API_CONFIG.useMockApi) {
    console.warn(`🎭 Mock mode: Blocking real API call to ${endpoint}. Use apiClient instead.`);
    return {
      error: 'Real API calls are disabled in mock mode. Use apiClient instead.',
      status: 400,
    };
  }

  try {
    const url = `${API_BASE_URL}${endpoint}`;

    // Add CORS mode to options
    const fetchOptions: RequestInit = {
      ...options,
      mode: 'cors',
    };

    console.log(`Fetching from URL: ${url}`);
    console.log(`Including auth header: ${options.headers && 'Authorization' in options.headers}`);

    const response = await fetch(url, fetchOptions);
    const status = response.status;

    // Handle JSON response
    const data = await response.json().catch(() => {
      console.warn('Could not parse JSON response');
      return {};
    });

    if (!response.ok) {
      console.error(`API error (${status}):`, data);
      
      // Handle 401 Unauthorized - token expired or invalid
      if (status === 401) {
        // Only handle token cleanup once to prevent loops
        const cleanupKey = 'token_cleanup_in_progress';
        
        if (!sessionStorage.getItem(cleanupKey)) {
          sessionStorage.setItem(cleanupKey, 'true');
          
          console.warn('Received 401 - clearing auth and redirecting to login');
          // Clear all auth data
          removeAuthToken();
          sessionStorage.clear();
          localStorage.clear();
          
          // Redirect to login page after a small delay
          setTimeout(() => {
            window.location.href = '/?error=session_expired';
          }, 100);
        }
      }
      
      return {
        error: data.message || 'Something went wrong',
        status,
      };
    }

    return {
      data: data as T,
      status,
    };
  } catch (error) {
    console.error('API call failed:', error);
    return {
      error: 'Network error',
      status: 500,
    };
  }
}

// Auth API
export const authApi = {
  // Login with LINE ID token
  lineLogin: async (idToken: string) => {
    return fetchApi<{ token: string; user: any }>('/auth/line', {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify({ idToken }),
    });
  },
  
  // Bind employee ID to LINE user
  bindEmployeeId: async (employeeId: string, lineUserId: string, profilePicture?: string | null) => {
    return fetchApi<{ token: string; user: any }>('/auth/bind-employee', {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify({ employeeId, lineUserId, profilePicture }),
    });
  },
};

// User API
export const userApi = {
  // Get current user profile with caching
  getCurrentUser: async (bypassCache: boolean = false) => {
    const cacheKey = 'current_user_profile';
    
    try {
      // If bypassCache is true, skip cache lookup
      if (!bypassCache) {
        // Check if we have a cached response and it's fresh
        const cachedData = apiCache.get<ApiResponse<{ user: any }>>(cacheKey);
        if (cachedData) {
          console.log("Using cached user profile");
          return cachedData;
        }
      } else {
        console.log("Bypassing cache for user profile");
      }
      
      // If not in cache or bypassing cache, fetch from API
      const response = await fetchApi<{ user: any }>('/users/me', {
        method: 'GET',
        headers: createHeaders(),
      });
      
      // Debug log the user data
      if (response.data?.user) {
        console.log("User profile from API - Job field:", response.data.user.Job);
      }
      
      // Cache the response for 30 seconds if it's successful and not bypassing cache
      if (response.data && !response.error && !bypassCache) {
        apiCache.set(cacheKey, response, 30000);
      }
      
      return response;
    } catch (error) {
      // If there's any error with the cache, just do a normal fetch
      console.error("Error with cache, falling back to direct API call:", error);
      return fetchApi<{ user: any }>('/users/me', {
        method: 'GET',
        headers: createHeaders(),
      });
    }
  },

  // Get users list (for giving credit) with caching
  getUsers: async (departmentId?: string, searchTerm?: string) => {
    let query = '';
    if (departmentId) query += `departmentId=${departmentId}&`;
    if (searchTerm) query += `searchTerm=${encodeURIComponent(searchTerm)}&`;

    // Create a cache key based on the query parameters
    const cacheKey = `users_list_${departmentId || ''}_${searchTerm || ''}`;
    
    try {
      // Check if we have a cached response
      const cachedData = apiCache.get<ApiResponse<{ users: any[] }>>(cacheKey);
      if (cachedData) {
        console.log("Using cached users list");
        return cachedData;
      }
      
      // If not in cache, fetch from API
      const response = await fetchApi<{ users: any[] }>(`/users/list?${query}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      
      // Cache the response for 5 minutes (300000ms) if it's successful
      if (response.data && !response.error) {
        apiCache.set(cacheKey, response, 300000);
      }
      
      return response;
    } catch (error) {
      console.error("Error with users cache, falling back to direct API call:", error);
      // If there's any error with the cache, just do a normal fetch
      return fetchApi<{ users: any[] }>(`/users/list?${query}`, {
        method: 'GET',
        headers: createHeaders(),
      });
    }
  },

  // Admin: Get all users
  getAllUsers: async (page = 1, limit = 20, departmentId?: string, searchTerm?: string, role?: string) => {
    let query = `page=${page}&limit=${limit}`;
    if (departmentId) query += `&departmentId=${departmentId}`;
    if (searchTerm) query += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    if (role) query += `&role=${role}`;

    return fetchApi<PaginatedResponse<any>>(`/users/all?${query}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Admin: Create user
  createUser: async (userData: any) => {
    return fetchApi<{ message: string; user: any }>('/users', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(userData),
    });
  },

  // Admin: Update user
  updateUser: async (id: string, userData: any) => {
    return fetchApi<{ message: string; user: any }>(`/users/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(userData),
    });
  },

  // Admin: Delete user
  deleteUser: async (id: string) => {
    return fetchApi<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },

  // Get daily credit statistics
  getDailyStats: async () => {
    return fetchApi<{
      stats: {
        totalReceived: number;
        todayReceived: number;
        yesterdayReceived: number;
        dayBeforeReceived: number;
        remainingDailyCredits: number;
        dailyLimit: number;
      }
    }>('/users/daily-stats', {
      method: 'GET',
      headers: createHeaders(),
    });
  },
};

// Credit API
export const creditApi = {
  // Give credit to another user
  giveCredit: async (receiverId: string, reason: string) => {
    const response = await fetchApi<{ message: string; credit: any; remainingCredits: number }>('/credits', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ receiverId, reason }),
    });

    // If the credit was given successfully, invalidate user cache to refresh the data
    if (response.data && !response.error) {
      // Invalidate current user cache to refresh remaining credits
      apiCache.delete('current_user_profile');
    }

    return response;
  },

  // Give credit to multiple users (bulk operation)
  giveBulkCredit: async (receiverIds: string[], reason: string) => {
    const response = await fetchApi<{ 
      message: string; 
      creditsCreated: number;
      remainingCredits: number;
      credits: any[];
    }>('/credits/bulk', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ receiverIds, reason }),
    });

    // If the credit was given successfully, invalidate user cache to refresh the data
    if (response.data && !response.error) {
      // Invalidate current user cache to refresh remaining credits
      apiCache.delete('current_user_profile');
    }

    return response;
  },

  // Get credits received by current user
  getReceivedCredits: async (page = 1, limit = 10) => {
    return fetchApi<{
      totalItems: number;
      totalPages: number;
      currentPage: number;
      credits: any[];
    }>(`/credits/received?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get credits sent by current user
  getSentCredits: async (page = 1, limit = 10) => {
    return fetchApi<{
      totalItems: number;
      totalPages: number;
      currentPage: number;
      credits: any[];
    }>(`/credits/sent?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Admin: Get all credits
  getAllCredits: async (
    page = 1,
    limit = 20,
    departmentId?: string,
    startDate?: string,
    endDate?: string,
    searchTerm?: string
  ) => {
    let query = `page=${page}&limit=${limit}`;
    if (departmentId) query += `&departmentId=${departmentId}`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;
    if (searchTerm) query += `&searchTerm=${encodeURIComponent(searchTerm)}`;

    return fetchApi<PaginatedResponse<any>>(`/credits/all?${query}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },
};

// Admin API
export const adminApi = {
  // Get all users (admin only)
  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    role?: string;
    sortField?: string;
    sortOrder?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.departmentId) query.append('departmentId', params.departmentId);
    if (params.role) query.append('role', params.role);
    if (params.sortField) query.append('sortField', params.sortField);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return fetchApi<{
      users: any[];
      totalPages: number;
      currentPage: number;
      totalCount: number;
    }>(`/admin/users?${query.toString()}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Create user (admin only)
  createUser: async (userData: any) => {
    return fetchApi<{ message: string; user: any }>('/admin/users', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(userData),
    });
  },

  // Update user (admin only)
  updateUser: async (userId: string, userData: any) => {
    return fetchApi<{ message: string; user: any }>(`/admin/users/${userId}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(userData),
    });
  },

  // Delete user (admin only)
  deleteUser: async (userId: string) => {
    return fetchApi<{ message: string }>(`/admin/users/${userId}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },

  // Get all credits (admin only)
  getCredits: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    sortField?: string;
    sortOrder?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.departmentId) query.append('departmentId', params.departmentId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.sortField) query.append('sortField', params.sortField);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return fetchApi<{
      credits: any[];
      totalPages: number;
      currentPage: number;
      totalCount: number;
    }>(`/admin/credits?${query.toString()}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Export credits to CSV (admin only)
  exportCredits: async (params: {
    search?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.departmentId) query.append('departmentId', params.departmentId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    return fetchApi<string>(`/admin/credits/export?${query.toString()}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get jobs for a specific department (admin only)
  getJobsForDepartment: async (departmentId: string) => {
    return fetchApi<{
      jobs: Array<{
        id: string;
        name: string;
        level: number;
        department: {
          id: string;
          name: string;
        };
      }>;
    }>(`/admin/departments/${departmentId}/jobs`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },
};

// Department API
export const departmentApi = {
  // Get all departments
  getDepartments: async () => {
    return fetchApi<{ departments: any[] }>('/departments', {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Admin: Get all departments with pagination and search
  getAdminDepartments: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.sortField) query.append('sortField', params.sortField);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return fetchApi<{
      departments: any[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/admin/departments?${query.toString()}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Admin: Create department
  createDepartment: async (data: { name: string; description?: string; isActive?: boolean }) => {
    return fetchApi<{ message: string; department: any }>('/admin/departments', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Admin: Update department
  updateDepartment: async (id: string, data: { name?: string; description?: string; isActive?: boolean }) => {
    return fetchApi<{ message: string; department: any }>(`/admin/departments/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Admin: Delete department
  deleteDepartment: async (id: string) => {
    return fetchApi<{ message: string }>(`/admin/departments/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

export const skillApi = {
  // Get user's skill progress
  getUserSkills: async (bypassCache: boolean = false) => {
    const url = bypassCache ? `/skills/user?_t=${Date.now()}` : '/skills/user';
    return fetchApi<{ userSkills: any[] }>(url, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get skills available for user's job
  getJobSkills: async (bypassCache: boolean = false) => {
    const url = bypassCache ? `/skills/job?_t=${Date.now()}` : '/skills/job';
    return fetchApi<{ job: any; skillsWithProgress: any[] }>(url, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get department-based job progression for skill roadmap
  getDepartmentProgression: async (bypassCache: boolean = false) => {
    const url = bypassCache ? `/skills/department-progression?_t=${Date.now()}` : '/skills/department-progression';
    return fetchApi<{ 
      department: string; 
      currentJob: string; 
      jobProgression: Array<{
        id: string;
        name: string;
        level: number;
        isCurrentJob: boolean;
        skillsWithProgress: any[];
      }>;
    }>(url, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get suggested skills (next job level)
  getSuggestedSkills: async () => {
    return fetchApi<{ nextJob: any; suggestedSkills: any[] }>('/skills/suggested', {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get skill statistics
  getSkillStats: async () => {
    return fetchApi<{ skillStats: any; total: number; completed: number; completionPercentage: number }>('/skills/stats', {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Update user skill progress
  updateSkillProgress: async (skillId: string, data: { status?: string; score?: number; notes?: string; startedAt?: string }) => {
    return fetchApi<{ message: string; userSkill: any }>(`/skills/${skillId}/progress`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Request evaluation for a skill
  requestEvaluation: async (skillId: string) => {
    return fetchApi<{ message: string; evaluationRequest: any }>(`/skills/${skillId}/request-evaluation`, {
      method: 'POST',
      headers: createHeaders(),
    });
  },

  // Submit evaluation result by userSkillId (for evaluators)
  submitEvaluationByUserSkillId: async (userSkillId: string, evaluationData: { result: string; score: number; feedback: string; evaluatedAt: string }) => {
    return fetchApi<{ message: string; userSkill: any }>(`/skills/evaluate/${userSkillId}`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(evaluationData),
    });
  },

  // Get evaluation details by userSkillId (for evaluators)
  getEvaluationDetailsByUserSkillId: async (userSkillId: string) => {
    return fetchApi<{ skill: any; userSkill: any; user: any }>(`/skills/evaluation-details/${userSkillId}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Admin: Get all pending evaluations
  getPendingEvaluations: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    sortField?: string;
    sortOrder?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.departmentId) query.append('departmentId', params.departmentId);
    if (params.sortField) query.append('sortField', params.sortField);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return fetchApi<{
      evaluations: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(`/skills/pending-evaluations?${query.toString()}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Admin: Get all skills with pagination and search
  getAdminSkills: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    departmentId?: string;
    sortField?: string;
    sortOrder?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.departmentId) query.append('departmentId', params.departmentId);
    if (params.sortField) query.append('sortField', params.sortField);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return fetchApi<{
      skills: any[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      categories: string[];
    }>(`/admin/skills?${query.toString()}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Admin: Create skill
  createSkill: async (data: {
    name: string;
    category: string;
    isRequired?: boolean;
    learningMethod: string;
    assessmentMethod: string;
    departmentIds?: string[];
  }) => {
    return fetchApi<{ message: string; skill: any }>('/admin/skills', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Admin: Update skill
  updateSkill: async (id: string, data: {
    name?: string;
    category?: string;
    isRequired?: boolean;
    learningMethod?: string;
    assessmentMethod?: string;
    departmentIds?: string[];
  }) => {
    return fetchApi<{ message: string; skill: any }>(`/admin/skills/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Admin: Delete skill
  deleteSkill: async (id: string) => {
    return fetchApi<{ message: string }>(`/admin/skills/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },

  // Get skill prerequisites
  getSkillPrerequisites: async (skillId: string) => {
    return fetchApi<{ prerequisites: any[] }>(`/admin/skills/${skillId}/prerequisites`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Add skill prerequisite
  addSkillPrerequisite: async (skillId: string, data: { prerequisiteSkillId: string, isRequired?: boolean }) => {
    return fetchApi<{ message: string }>(`/admin/skills/${skillId}/prerequisites`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Update skill prerequisite
  updateSkillPrerequisite: async (skillId: string, prerequisiteSkillId: string, data: { isRequired: boolean }) => {
    return fetchApi<{ message: string }>(`/admin/skills/${skillId}/prerequisites/${prerequisiteSkillId}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Remove skill prerequisite
  removeSkillPrerequisite: async (skillId: string, prerequisiteSkillId: string) => {
    return fetchApi<{ message: string }>(`/admin/skills/${skillId}/prerequisites/${prerequisiteSkillId}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

// Skill Categories API
export const skillCategoryApi = {
  // Get all skill categories
  getSkillCategories: async (params?: {
    search?: string;
    isActive?: boolean;
    sortField?: string;
    sortOrder?: string;
    includeSkillCount?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.isActive !== undefined) query.append('isActive', params.isActive.toString());
    if (params?.sortField) query.append('sortField', params.sortField);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params?.includeSkillCount) query.append('includeSkillCount', params.includeSkillCount.toString());

    return fetchApi<{
      categories: Array<{
        id: string;
        name: string;
        description?: string;
        color?: string;
        icon?: string;
        isActive: boolean;
        sortOrder: number;
        skillCount?: number;
        createdAt: string;
        updatedAt: string;
      }>;
    }>(`/skill-categories?${query.toString()}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get skill category by ID
  getSkillCategoryById: async (id: string) => {
    return fetchApi<{
      category: {
        id: string;
        name: string;
        description?: string;
        color?: string;
        icon?: string;
        isActive: boolean;
        sortOrder: number;
        skills?: Array<{ id: string; name: string }>;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/skill-categories/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Create new skill category
  createSkillCategory: async (categoryData: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) => {
    return fetchApi<{
      category: {
        id: string;
        name: string;
        description?: string;
        color?: string;
        icon?: string;
        isActive: boolean;
        sortOrder: number;
        createdAt: string;
        updatedAt: string;
      };
      message: string;
    }>('/skill-categories', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(categoryData),
    });
  },

  // Get or create skill category by name
  getOrCreateSkillCategory: async (name: string) => {
    return fetchApi<{
      category: {
        id: string;
        name: string;
        description?: string;
        color?: string;
        icon?: string;
        isActive: boolean;
        sortOrder: number;
        createdAt: string;
        updatedAt: string;
      };
    }>('/skill-categories/get-or-create', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ name }),
    });
  },

  // Update skill category
  updateSkillCategory: async (id: string, categoryData: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    isActive?: boolean;
    sortOrder?: number;
  }) => {
    return fetchApi<{
      category: {
        id: string;
        name: string;
        description?: string;
        color?: string;
        icon?: string;
        isActive: boolean;
        sortOrder: number;
        createdAt: string;
        updatedAt: string;
      };
      message: string;
    }>(`/skill-categories/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(categoryData),
    });
  },

  // Delete skill category
  deleteSkillCategory: async (id: string) => {
    return fetchApi<{ message: string }>(`/skill-categories/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

export const jobApi = {
  // Admin: Get jobs with pagination and filtering
  getAdminJobs: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    sortField?: string;
    sortOrder?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.departmentId) query.append('departmentId', params.departmentId);
    if (params.sortField) query.append('sortField', params.sortField);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return fetchApi<{
      jobs: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(`/admin/jobs?${query.toString()}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Admin: Create job
  createJob: async (data: { 
    name: string; 
    departmentId: string; 
    skillIds?: Array<{ id: string; isRequired: boolean }> 
  }) => {
    return fetchApi<{ message: string; job: any }>('/admin/jobs', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Admin: Update job
  updateJob: async (id: string, data: {
    name?: string;
    departmentId?: string;
    skillIds?: Array<{ id: string; isRequired: boolean }>;
  }) => {
    return fetchApi<{ message: string; job: any }>(`/admin/jobs/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
  },

  // Admin: Delete job
  deleteJob: async (id: string) => {
    return fetchApi<{ message: string }>(`/admin/jobs/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

// User promotion API
export const promotionApi = {
  // Check if user can be promoted
  checkUserPromotion: async (userId: string) => {
    return fetchApi<{
      canPromote: boolean;
      nextJob?: {
        id: string;
        name: string;
      };
      currentJob: {
        id: string;
        name: string;
      };
      requiredSkills: Array<{
        id: string;
        name: string;
        category: string;
        completed: boolean;
      }>;
      completedSkills: Array<{
        id: string;
        name: string;
        category: string;
        status: string;
        score?: number;
      }>;
      message?: string;
      isMaxLevel?: boolean;
    }>(`/admin/users/${userId}/promotion-check`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Promote user to next job level
  promoteUser: async (userId: string) => {
    return fetchApi<{
      message: string;
      user: {
        id: string;
        name: string;
        employeeId: string;
        previousJob: string;
        newJob: string;
        department?: string;
      };
    }>(`/admin/users/${userId}/promote`, {
      method: 'POST',
      headers: createHeaders(),
    });
  },
};

// Utility functions
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    // Store in both sessionStorage and localStorage
    // sessionStorage is cleared when tab is closed
    // localStorage persists across browser sessions
    sessionStorage.setItem('authToken', token);
    localStorage.setItem('authToken', token);
    console.log("Auth token saved to storage");
  }
};

const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('authToken');
    console.log("Auth token removed from storage");
  }
};

export { removeAuthToken };

// Get auth token from storage (checking both types)
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Try sessionStorage first, then localStorage
    return sessionStorage.getItem('authToken') ||
           localStorage.getItem('authToken');
  }
  return null;
};

// CSV Import API
export const csvApi = {
  // Import users from CSV
  importUsers: async (file: File) => {
    const formData = new FormData();
    formData.append('csv', file);
    
    const response = await fetch(`${API_BASE_URL}/csv-import/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return response.json();
  },

  // Import skills from CSV
  importSkills: async (file: File) => {
    const formData = new FormData();
    formData.append('csv', file);
    
    const response = await fetch(`${API_BASE_URL}/csv-import/skills`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return response.json();
  },

  // Import departments from CSV
  importDepartments: async (file: File) => {
    const formData = new FormData();
    formData.append('csv', file);
    
    const response = await fetch(`${API_BASE_URL}/csv-import/departments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return response.json();
  },

  // Import jobs from CSV
  importJobs: async (file: File) => {
    const formData = new FormData();
    formData.append('csv', file);
    
    const response = await fetch(`${API_BASE_URL}/csv-import/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return response.json();
  },

  // Download example CSV
  downloadExample: async (type: 'users' | 'skills' | 'departments' | 'jobs') => {
    const response = await fetch(`${API_BASE_URL}/csv-import/example/${type}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-example.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// Config API
export const configApi = {
  // Get all configs (admin only)
  getConfigs: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    sortField?: string;
    sortOrder?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.sortField) query.append('sortField', params.sortField);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    return fetchApi<{
      configs: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/config?${query.toString()}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get config categories
  getConfigCategories: async () => {
    return fetchApi<{
      success: boolean;
      categories: string[];
    }>('/config/meta/categories', {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get config by key (admin only)
  getConfigByKey: async (key: string) => {
    return fetchApi<{
      success: boolean;
      config: any;
    }>(`/config/${key}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get public config value
  getPublicConfigValue: async (key: string) => {
    return fetchApi<{
      success: boolean;
      key: string;
      value: any;
    }>(`/config/public/${key}`, {
      method: 'GET',
      headers: createHeaders(false), // No auth required for public endpoint
    });
  },

  // Create config (admin only)
  createConfig: async (configData: {
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
    category?: string;
    isEditable?: boolean;
  }) => {
    return fetchApi<{
      success: boolean;
      message: string;
      config: any;
    }>('/config', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(configData),
    });
  },

  // Update config (admin only)
  updateConfig: async (key: string, configData: {
    value?: string;
    type?: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
    category?: string;
    isEditable?: boolean;
  }) => {
    return fetchApi<{
      success: boolean;
      message: string;
      config: any;
    }>(`/config/${key}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(configData),
    });
  },

  // Delete config (admin only)
  deleteConfig: async (key: string) => {
    return fetchApi<{
      success: boolean;
      message: string;
    }>(`/config/${key}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },

  // Bulk update configs (admin only)
  bulkUpdateConfigs: async (configs: Array<{
    key: string;
    value: string;
    type?: string;
    description?: string;
    category?: string;
  }>) => {
    return fetchApi<{
      success: boolean;
      message: string;
      results: any[];
      errors: any[];
    }>('/config/bulk', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ configs }),
    });
  },
};

export default {
  authApi,
  userApi,
  creditApi,
  departmentApi,
  skillApi,
  csvApi,
  configApi,
  setAuthToken,
  removeAuthToken,
};