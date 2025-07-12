'use client'

import { useState, useEffect } from 'react'
import { API_CONFIG } from '@/config/api-config'
import { mockDevTools } from '@/lib/mock-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RefreshCw, Users, Settings, Database, LogOut, ChevronUp, ChevronDown } from 'lucide-react'

interface MockDevPanelProps {
  className?: string
}

export function MockDevPanel({ className }: MockDevPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [currentState, setCurrentState] = useState<any>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  // Only show in development and mock mode
  useEffect(() => {
    const shouldShow = process.env.NODE_ENV === 'development' && API_CONFIG.useMockApi
    setIsVisible(shouldShow)
    
    if (shouldShow) {
      refreshData()
    }
  }, [])

  const refreshData = () => {
    try {
      const usersList = mockDevTools.listUsers()
      const state = mockDevTools.getState()
      setUsers(usersList)
      setCurrentState(state)
      
      const currentUser = usersList.find(u => u.isCurrent)
      if (currentUser) {
        setSelectedUserId(currentUser.id)
      }
    } catch (error) {
      console.error('Failed to refresh mock data:', error)
    }
  }

  const handleUserSwitch = (userId: string) => {
    mockDevTools.loginAs(userId)
    setSelectedUserId(userId)
    refreshData()
    // No need to reload the page - auth context will handle the update
  }

  const handleRoleSwitch = (role: 'user' | 'admin') => {
    mockDevTools.switchRole(role)
    refreshData()
    // No need to reload the page - auth context will handle the update
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all mock data? This will reload the page.')) {
      mockDevTools.reset()
      window.location.reload()
    }
  }

  const handleLogout = () => {
    mockDevTools.logout()
    refreshData()
    window.location.reload()
  }

  const handleClearState = () => {
    if (confirm('Clear persistent mock state? This will reset on page reload.')) {
      mockDevTools.clearPersistentState()
    }
  }

  if (!isVisible) return null

  const currentUser = users.find(u => u.isCurrent)

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-80 sm:max-w-sm ${className}`}>
      <Card className="border-yellow-200 bg-yellow-50 shadow-lg">
        <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <CardTitle className="text-sm font-medium text-yellow-800">
                  🎭 Mock Dev Tools
                </CardTitle>
                <CardDescription className="text-xs text-yellow-600">
                  Development utilities for mock API
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                MOCK MODE
              </Badge>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-yellow-700" />
              ) : (
                <ChevronUp className="h-4 w-4 text-yellow-700" />
              )}
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="space-y-4">
          {/* Current User Info */}
          {currentUser && (
            <div className="bg-white p-3 rounded border border-yellow-200">
              <Label className="text-xs font-medium text-yellow-800">Current User</Label>
              <div className="mt-1">
                <div className="text-sm font-medium">{currentUser.name}</div>
                <div className="text-xs text-gray-600 flex items-center gap-2">
                  <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                    {currentUser.role}
                  </Badge>
                  <span>{currentUser.id}</span>
                </div>
              </div>
            </div>
          )}

          {/* User Switching */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-yellow-800">Switch User</Label>
            <Select value={selectedUserId} onValueChange={handleUserSwitch}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span>{user.name}</span>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {user.role}
                      </Badge>
                      {user.isCurrent && <span className="text-green-600">●</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Role Switch */}
          {currentUser && (
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-yellow-800">Role:</Label>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={currentUser.role === 'user' ? 'default' : 'outline'}
                  onClick={() => handleRoleSwitch('user')}
                  className="h-6 px-2 text-xs"
                >
                  User
                </Button>
                <Button
                  size="sm"
                  variant={currentUser.role === 'admin' ? 'default' : 'outline'}
                  onClick={() => handleRoleSwitch('admin')}
                  className="h-6 px-2 text-xs"
                >
                  Admin
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={refreshData}
              className="h-7 px-2 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="h-7 px-2 text-xs"
            >
              <Database className="w-3 h-3 mr-1" />
              Reset
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="h-7 px-2 text-xs"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Logout
            </Button>
          </div>

          {/* State Info */}
          {currentState && (
            <div className="text-xs text-yellow-700 bg-white p-2 rounded border border-yellow-200">
              <div>Users: {currentState.users?.length || 0}</div>
              <div>Credits: {currentState.credits?.length || 0}</div>
              <div>Skills: {currentState.userSkills?.length || 0}</div>
              <div>Auth: {currentState.isAuthenticated ? '✅' : '❌'}</div>
            </div>
          )}

          {/* Settings */}
          <details className="text-xs">
            <summary className="cursor-pointer text-yellow-800 font-medium">
              Settings
            </summary>
            <div className="mt-2 space-y-2 bg-white p-2 rounded border border-yellow-200">
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearState}
                className="h-6 px-2 text-xs w-full"
              >
                Clear Persistent State
              </Button>
              
              <div className="text-xs text-gray-600">
                <div>Delay: {API_CONFIG.mockDelay.min}-{API_CONFIG.mockDelay.max}ms</div>
                <div>Errors: {API_CONFIG.mockErrors ? 'On' : 'Off'}</div>
                <div>Persist: {API_CONFIG.persistMockState ? 'On' : 'Off'}</div>
              </div>
            </div>
          </details>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default MockDevPanel