# Mock API System Guide

The Mock API system allows frontend developers to work completely independently from the backend, enabling rapid UI development, testing, and prototyping.

## Quick Start

### 1. Enable Mock Mode

Copy the environment example and enable mock mode:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_USE_MOCK_API=true
```

### 2. Start Development

```bash
npm run dev
```

That's it! Your frontend now runs entirely with mock data.

## Features

### 🎭 Complete Backend Replacement
- **Full API compatibility** - All endpoints work identically to real backend
- **Realistic data** - Generated users, skills, credits, departments
- **Persistent state** - Mock data persists across page reloads
- **Real-time simulation** - Socket.IO notifications work

### 🛠 Development Tools
- **Visual dev panel** - Switch users, roles, reset data
- **Console utilities** - Debug and manipulate mock state
- **Configurable delays** - Simulate realistic API response times
- **Error simulation** - Test error handling scenarios

### 📊 Realistic Mock Data
- **50 users** across 8 departments with realistic names
- **20+ skills** with categories and progression
- **Job hierarchy** - 新手村 → 助理工程師 → 正式工程師 → 資深工程師
- **Credit transactions** - Realistic credit giving/receiving patterns
- **Skill progress** - Various completion states and scores

## Configuration

### Environment Variables

```env
# Core mock settings
NEXT_PUBLIC_USE_MOCK_API=true          # Enable/disable mock mode
NEXT_PUBLIC_MOCK_LOGS=true             # Show mock API logs in console
NEXT_PUBLIC_PERSIST_MOCK_STATE=true    # Save mock state to localStorage

# Response timing
NEXT_PUBLIC_MOCK_DELAY_MIN=200         # Minimum API delay (ms)
NEXT_PUBLIC_MOCK_DELAY_MAX=800         # Maximum API delay (ms)

# Error simulation
NEXT_PUBLIC_MOCK_ERRORS=false          # Enable random errors for testing
```

### Default Mock Settings

```typescript
// config/api-config.ts
export const MOCK_CONFIG = {
  userCount: 50,                    // Number of mock users
  skillCount: 30,                   // Number of skills
  departmentCount: 8,               // Number of departments
  creditTransactionsPerUser: 20,    // Credits per user
  currentUserId: 'mock-user-1',     // Default logged-in user
  currentUserRole: 'user'           // Default role ('user' | 'admin')
}
```

## Development Tools

### Visual Dev Panel

A floating development panel appears in the bottom-right corner (development mode only):

- **User switching** - Instantly switch between any mock user
- **Role switching** - Toggle between user/admin roles
- **Data management** - Reset, refresh, view state
- **Quick actions** - Logout, clear persistent state

### Console Utilities

Access via browser console:

```javascript
// Switch current user
mockDevTools.loginAs('mock-user-5')

// Change role
mockDevTools.switchRole('admin')

// List all users
mockDevTools.listUsers()

// Reset all data
mockDevTools.reset()

// View current state
mockDevTools.getState()

// Logout
mockDevTools.logout()

// Clear saved state
mockDevTools.clearPersistentState()
```

## Mock Data Structure

### Users
- **Realistic names** - Chinese names with proper formatting
- **Department assignment** - Users distributed across departments
- **Job positions** - Career progression levels
- **Credit balances** - Realistic sent/received amounts
- **Profile pictures** - Generated avatar images

### Skills System
- **Skill categories** - 山恩DNA, 產品知識, 工具使用, 安裝知識, 安全操作
- **Learning methods** - 實體 (Physical), 線上 (Online)
- **Assessment methods** - 考卷考核 (Exam), 實作考核 (Practical)
- **Progress tracking** - Various completion states with scores
- **Job requirements** - Skills mapped to job positions

### Credit System
- **Transaction history** - Realistic giving/receiving patterns
- **Daily limits** - Configurable daily credit limits
- **Reason tracking** - Common reasons for credit giving
- **Real-time updates** - Socket.IO notifications

## Use Cases

### 🎨 UI/UX Development
```bash
# Perfect for:
- Layout modifications
- Component styling
- Responsive design
- Theme development
- Animation work
```

### 🧪 Feature Testing
```bash
# Test scenarios:
- User role switching
- Different data states
- Edge cases (empty data, max values)
- Error conditions
- Loading states
```

### 📱 Demo & Prototyping
```bash
# Great for:
- Stakeholder presentations
- Feature demonstrations
- User testing sessions
- Design reviews
```

### 🏃‍♂️ Rapid Development
```bash
# Enables:
- No backend dependency
- Instant setup
- Offline development
- Fast iteration cycles
```

## API Compatibility

The mock API implements the exact same interface as the real backend:

```typescript
// All these work identically in mock mode:
await apiClient.getCurrentUser()
await apiClient.giveCredit(receiverId, reason)
await apiClient.getUserSkills()
await apiClient.getAdminUsers(params)
// ... all other endpoints
```

### Response Format
Mock responses match the real API format exactly:

```typescript
// Real API response format
{
  data: { user: { ... } },
  status: 200
}

// Mock API response format (identical)
{
  data: { user: { ... } },
  status: 200
}
```

## Switching Between Mock and Real API

### Development Workflow

1. **Start with mock** - Rapid UI development
2. **Switch to real** - Integration testing
3. **Back to mock** - Debug specific scenarios
4. **Production** - Always uses real API

### Environment Switching

```bash
# Enable mock mode
echo "NEXT_PUBLIC_USE_MOCK_API=true" >> .env.local

# Disable mock mode (use real backend)
echo "NEXT_PUBLIC_USE_MOCK_API=false" >> .env.local
```

### Runtime Switching
No code changes needed - just environment variable toggle.

## Best Practices

### 🎯 When to Use Mock API
- ✅ UI/UX development and styling
- ✅ Component development
- ✅ Layout and responsive design
- ✅ Frontend feature development
- ✅ Demo preparations
- ✅ Offline development

### 🎯 When to Use Real API
- ✅ Backend integration testing
- ✅ End-to-end testing
- ✅ Performance testing with real data
- ✅ Production deployment
- ✅ Data validation testing

### 💡 Development Tips

1. **Start with mock** for new features
2. **Use dev panel** to test different user scenarios
3. **Reset data** when testing edge cases
4. **Switch users** to test role-based features
5. **Check console logs** for API call debugging

## Troubleshooting

### Common Issues

**Mock panel not showing**
- Check `NODE_ENV=development`
- Verify `NEXT_PUBLIC_USE_MOCK_API=true`
- Clear browser cache

**Data not persisting**
- Check `NEXT_PUBLIC_PERSIST_MOCK_STATE=true`
- Clear localStorage if corrupted: `mockDevTools.clearPersistentState()`

**API calls failing**
- Check browser console for errors
- Verify mock API logs are enabled
- Reset mock state: `mockDevTools.reset()`

**Real API mixed with mock**
- Ensure consistent environment variables
- Restart development server after changes
- Check `.env.local` file

### Debug Commands

```javascript
// Check current config
console.log(API_CONFIG)

// Verify mock mode
console.log('Mock mode:', API_CONFIG.useMockApi)

// View mock state
console.log(mockDevTools.getState())

// Reset everything
mockDevTools.reset()
window.location.reload()
```

## Architecture

### File Structure
```
├── config/
│   └── api-config.ts          # Configuration settings
├── lib/
│   ├── api-client.ts          # Unified API client
│   ├── api-mock.ts            # Mock API implementation
│   ├── mock-data.ts           # Mock data generation
│   └── mock-utils.ts          # Development utilities
└── components/
    └── mock-dev-panel.tsx     # Visual development tools
```

### Key Components

1. **API Client** - Unified interface that switches between real/mock
2. **Mock Data** - Realistic generated data matching backend schema
3. **Mock API** - Full API implementation with state management
4. **Dev Tools** - Visual and console utilities for development

This system provides complete frontend independence while maintaining perfect compatibility with the real backend API.