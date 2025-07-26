import { useState, useEffect } from 'react'
import { configApi } from '@/lib/api'
import { setUseMockApi } from '@/lib/api-client'

interface SystemConfig {
  systemName: string
  useMockApi: boolean
  defaultDailyCreditLimit: number
  maintenanceMode: boolean
}

const defaultConfig: SystemConfig = {
  systemName: '山恩互動表彰系統',
  useMockApi: false,
  defaultDailyCreditLimit: 5,
  maintenanceMode: false
}

// Cache for config values to avoid repeated API calls
const configCache = new Map<string, { value: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getConfigValue(key: string, fallback: any, useRealApi: boolean = false): Promise<any> {
  // Check cache first
  const cached = configCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.value
  }

  try {
    // Use real API for critical config values or when explicitly requested
    const response = useRealApi 
      ? await configApi.getPublicConfigValue(key)
      : await configApi.getPublicConfigValue(key)
      
    if (response.data && response.data.success) {
      const value = response.data.value !== undefined ? response.data.value : fallback
      
      // Cache the result
      configCache.set(key, { value, timestamp: Date.now() })
      return value
    }
  } catch (error) {
    console.warn(`Failed to fetch config ${key}:`, error)
  }
  
  return fallback
}

// Clear cache for specific key or all cache
export function clearConfigCache(key?: string) {
  if (key) {
    configCache.delete(key)
  } else {
    configCache.clear()
  }
}

export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configPromises = [
          getConfigValue('system_name', defaultConfig.systemName),
          getConfigValue('use_mock_api', defaultConfig.useMockApi, true), // Always use real API for mock setting
          getConfigValue('default_daily_credit_limit', defaultConfig.defaultDailyCreditLimit),
          getConfigValue('maintenance_mode', defaultConfig.maintenanceMode)
        ]

        const [
          systemName,
          useMockApi,
          defaultDailyCreditLimit,
          maintenanceMode
        ] = await Promise.all(configPromises)

        setConfig({
          systemName,
          useMockApi,
          defaultDailyCreditLimit,
          maintenanceMode
        })

        // Update the API client mode if useMockApi changed
        setUseMockApi(useMockApi)
      } catch (error) {
        console.error('Failed to fetch system config:', error)
        // Keep default config on error
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()

    // Listen for global config updates
    const handleConfigUpdate = () => {
      console.log('🔔 Received systemConfigUpdated event, refreshing...')
      refreshConfig()
    }

    window.addEventListener('systemConfigUpdated', handleConfigUpdate)
    
    return () => {
      window.removeEventListener('systemConfigUpdated', handleConfigUpdate)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refreshConfig = async () => {
    // Clear cache and refetch
    configCache.clear()
    setLoading(true)
    
    // Re-run the effect logic
    const fetchConfig = async () => {
      try {
        const configPromises = [
          getConfigValue('system_name', defaultConfig.systemName),
          getConfigValue('use_mock_api', defaultConfig.useMockApi, true), // Always use real API for mock setting
          getConfigValue('default_daily_credit_limit', defaultConfig.defaultDailyCreditLimit),
          getConfigValue('maintenance_mode', defaultConfig.maintenanceMode)
        ]

        const [
          systemName,
          useMockApi,
          defaultDailyCreditLimit,
          maintenanceMode
        ] = await Promise.all(configPromises)

        console.log('🔄 Refreshed system config:', { systemName, useMockApi, maintenanceMode })

        setConfig({
          systemName,
          useMockApi,
          defaultDailyCreditLimit,
          maintenanceMode
        })

        // Update the API client mode if useMockApi changed
        setUseMockApi(useMockApi)
      } catch (error) {
        console.error('Failed to refresh system config:', error)
      } finally {
        setLoading(false)
      }
    }

    await fetchConfig()
  }

  return { config, loading, refreshConfig }
}

// Hook for just system name (most commonly used)
export function useSystemName() {
  const { config, loading } = useSystemConfig()
  return { systemName: config.systemName, loading }
}