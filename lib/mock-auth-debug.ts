import { API_CONFIG } from '@/config/api-config'

// Debug utilities for mock authentication
export const debugMockAuth = {
  log: (message: string, data?: any) => {
    if (API_CONFIG.useMockApi && API_CONFIG.enableMockLogs) {
      console.log(`🎭 Mock Auth: ${message}`, data)
    }
  },
  
  warn: (message: string, data?: any) => {
    if (API_CONFIG.useMockApi) {
      console.warn(`🎭 Mock Auth Warning: ${message}`, data)
    }
  },
  
  error: (message: string, data?: any) => {
    if (API_CONFIG.useMockApi) {
      console.error(`🎭 Mock Auth Error: ${message}`, data)
    }
  },
  
  checkState: () => {
    if (!API_CONFIG.useMockApi) return
    
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    const user = localStorage.getItem('user') || sessionStorage.getItem('user')
    
    console.log('🎭 Mock Auth State Check:', {
      mockMode: API_CONFIG.useMockApi,
      hasAuthToken: !!authToken,
      tokenType: authToken?.startsWith('mock-jwt-token-') ? 'mock' : 'real',
      hasUser: !!user,
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A'
    })
  }
}

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugMockAuth = debugMockAuth
}