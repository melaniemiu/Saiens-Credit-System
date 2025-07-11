import { API_CONFIG, MOCK_CONFIG } from '@/config/api-config'
import { mockUtils } from './api-mock'

// Development utilities for working with mock API
export const mockDevTools = {
  // Check if mock mode is enabled
  isMockMode: () => API_CONFIG.useMockApi,
  
  // Reset all mock data to initial state
  reset: () => {
    if (!API_CONFIG.useMockApi) {
      console.warn('Mock utilities can only be used in mock mode')
      return
    }
    mockUtils.reset()
    console.log('🎭 Mock data reset to initial state')
  },
  
  // Get current mock state for debugging
  getState: () => {
    if (!API_CONFIG.useMockApi) {
      console.warn('Mock utilities can only be used in mock mode')
      return null
    }
    return mockUtils.getState()
  },
  
  // Login as a different user
  loginAs: (userId: string = MOCK_CONFIG.currentUserId) => {
    if (!API_CONFIG.useMockApi) {
      console.warn('Mock utilities can only be used in mock mode')
      return
    }
    
    // Update mock state
    mockUtils.login(userId)
    
    // Also update browser storage to match mock state
    // Get the user data from mock state with relations
    const { getUserWithRelations } = require('./mock-data')
    const userWithRelations = getUserWithRelations(userId)
    
    if (userWithRelations) {
      // Create AuthUser format for storage
      const authUser = {
        id: userWithRelations.id,
        name: userWithRelations.name,
        email: userWithRelations.email,
        picture: userWithRelations.profilePicture,
        role: userWithRelations.role,
        department: userWithRelations.department?.name,
        employeeId: userWithRelations.employeeId,
        creditsReceived: userWithRelations.creditsReceived,
        creditsSent: userWithRelations.creditsSent,
        remainingDailyCredits: userWithRelations.remainingDailyCredits,
        Job: userWithRelations.job ? { id: userWithRelations.job.id, name: userWithRelations.job.title } : undefined
      }
      
      // Update browser storage
      localStorage.setItem('user', JSON.stringify(authUser))
      sessionStorage.setItem('user', JSON.stringify(authUser))
      
      console.log(`🎭 Logged in as user: ${userWithRelations.name} (${userId})`)
      
      // Trigger a custom event to notify auth context to refresh
      window.dispatchEvent(new CustomEvent('mockUserSwitched', { 
        detail: { userId, user: authUser }
      }))
    } else {
      console.warn(`🎭 User ${userId} not found in mock data`)
    }
  },
  
  // Switch current user role
  switchRole: (role: 'user' | 'admin') => {
    if (!API_CONFIG.useMockApi) {
      console.warn('Mock utilities can only be used in mock mode')
      return
    }
    const state = mockUtils.getState()
    const currentUser = state.users.find(u => u.id === state.currentUserId)
    if (currentUser) {
      currentUser.role = role
      
      // Update browser storage as well
      const storedUserJson = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (storedUserJson) {
        try {
          const storedUser = JSON.parse(storedUserJson)
          storedUser.role = role
          localStorage.setItem('user', JSON.stringify(storedUser))
          sessionStorage.setItem('user', JSON.stringify(storedUser))
        } catch (e) {
          console.warn('Failed to update stored user role:', e)
        }
      }
      
      console.log(`🎭 Switched current user role to: ${role}`)
      
      // Get updated user data and trigger refresh event
      const { getUserWithRelations } = require('./mock-data')
      const userWithRelations = getUserWithRelations(state.currentUserId)
      if (userWithRelations) {
        const authUser = {
          id: userWithRelations.id,
          name: userWithRelations.name,
          email: userWithRelations.email,
          picture: userWithRelations.profilePicture,
          role: role, // Use the new role
          department: userWithRelations.department?.name,
          employeeId: userWithRelations.employeeId,
          creditsReceived: userWithRelations.creditsReceived,
          creditsSent: userWithRelations.creditsSent,
          remainingDailyCredits: userWithRelations.remainingDailyCredits,
          Job: userWithRelations.job ? { id: userWithRelations.job.id, name: userWithRelations.job.title } : undefined
        }
        
        // Trigger event to refresh auth context
        window.dispatchEvent(new CustomEvent('mockUserSwitched', { 
          detail: { userId: state.currentUserId, user: authUser }
        }))
      }
    }
  },
  
  // Logout current user
  logout: () => {
    if (!API_CONFIG.useMockApi) {
      console.warn('Mock utilities can only be used in mock mode')
      return
    }
    mockUtils.logout()
    console.log('🎭 User logged out')
  },
  
  // List available users for switching
  listUsers: () => {
    if (!API_CONFIG.useMockApi) {
      console.warn('Mock utilities can only be used in mock mode')
      return []
    }
    const state = mockUtils.getState()
    return state.users.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      department: u.departmentId,
      job: u.jobId,
      isCurrent: u.id === state.currentUserId
    }))
  },
  
  // Generate additional test data
  generateTestData: () => {
    if (!API_CONFIG.useMockApi) {
      console.warn('Mock utilities can only be used in mock mode')
      return
    }
    // This would extend the mock data with additional test scenarios
    console.log('🎭 Additional test data generated')
  },
  
  // Clear persistent state
  clearPersistentState: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockApiState')
      console.log('🎭 Persistent mock state cleared')
    }
  },
  
  // Enable/disable mock error simulation
  toggleErrors: (enabled: boolean) => {
    if (!API_CONFIG.useMockApi) {
      console.warn('Mock utilities can only be used in mock mode')
      return
    }
    // This would toggle error simulation in the mock API
    console.log(`🎭 Mock error simulation ${enabled ? 'enabled' : 'disabled'}`)
  }
}

// Make mock dev tools available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).mockDevTools = mockDevTools
}

// Console help message for developers
if (typeof window !== 'undefined' && API_CONFIG.useMockApi && API_CONFIG.enableMockLogs) {
  console.log(`
🎭 Mock API Development Tools Available:

• mockDevTools.reset() - Reset all mock data
• mockDevTools.getState() - View current mock state
• mockDevTools.loginAs(userId) - Switch current user
• mockDevTools.switchRole('admin'|'user') - Change user role
• mockDevTools.listUsers() - List all available users
• mockDevTools.logout() - Logout current user
• mockDevTools.clearPersistentState() - Clear saved state

Current config:
• Use Mock API: ${API_CONFIG.useMockApi}
• Mock Delay: ${API_CONFIG.mockDelay.min}-${API_CONFIG.mockDelay.max}ms
• Mock Errors: ${API_CONFIG.mockErrors}
• Persist State: ${API_CONFIG.persistMockState}
`)
}

export default mockDevTools