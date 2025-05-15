// API service for communicating with the backend
import { API_URL } from '@/lib/env';
import { apiCache } from '@/lib/cache';

// API base URL - use the hardcoded URL as the API_URL from env might not be loaded
const API_BASE_URL = 'https://5.unayung.cc/api';

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
        // Clear expired token
        removeAuthToken();
        // Clear all auth storage
        sessionStorage.clear();
        localStorage.clear();
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
  bindEmployeeId: async (employeeId: string, lineUserId: string) => {
    return fetchApi<{ token: string; user: any }>('/auth/bind-employee', {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify({ employeeId, lineUserId }),
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
    return fetchApi<PaginatedResponse<any>>(`/credits/received?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  // Get credits given by current user
  getGivenCredits: async (page = 1, limit = 10) => {
    return fetchApi<PaginatedResponse<any>>(`/credits/given?page=${page}&limit=${limit}`, {
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

// Department API
export const departmentApi = {
  // Get all departments
  getDepartments: async () => {
    return fetchApi<{ departments: any[] }>('/departments', {
      method: 'GET',
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

export default {
  authApi,
  userApi,
  creditApi,
  departmentApi,
  setAuthToken,
  removeAuthToken,
};