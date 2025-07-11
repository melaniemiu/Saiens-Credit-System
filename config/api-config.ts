export const API_CONFIG = {
  // Core configuration
  useMockApi: process.env.NEXT_PUBLIC_USE_MOCK_API === 'true',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  
  // Mock-specific settings
  mockDelay: {
    min: parseInt(process.env.NEXT_PUBLIC_MOCK_DELAY_MIN || '200'),
    max: parseInt(process.env.NEXT_PUBLIC_MOCK_DELAY_MAX || '800')
  },
  
  // Development features
  mockErrors: process.env.NEXT_PUBLIC_MOCK_ERRORS === 'true',
  enableMockLogs: process.env.NEXT_PUBLIC_MOCK_LOGS === 'true',
  persistMockState: process.env.NEXT_PUBLIC_PERSIST_MOCK_STATE !== 'false',
  
  // Default pagination
  defaultPageSize: 10,
  maxPageSize: 100
}

export const MOCK_CONFIG = {
  // Data generation settings
  userCount: 50,
  skillCount: 30,
  departmentCount: 8,
  jobCount: 4,
  creditTransactionsPerUser: 20,
  
  // Realistic data ranges
  dailyCreditLimit: { min: 10, max: 50 },
  skillScore: { min: 60, max: 100 },
  creditAmount: { min: 1, max: 5 },
  
  // Current user settings (for consistent experience)
  currentUserId: 'mock-user-1',
  currentUserRole: 'user', // 'user' | 'admin'
  currentUserJob: 'assistant_engineer'
}

// Environment validation
if (typeof window !== 'undefined' && API_CONFIG.useMockApi && API_CONFIG.enableMockLogs) {
  console.log('🎭 Mock API enabled:', API_CONFIG)
}