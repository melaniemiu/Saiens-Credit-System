// Validate environment variables
export const getEnvChecked = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    console.warn(`Missing ${key} environment variable`)
    return ''
  }
  return value
}

// LIFF configuration
export const LIFF_ID = getEnvChecked('NEXT_PUBLIC_LIFF_ID')

// API URL
export const API_URL = getEnvChecked('NEXT_PUBLIC_API_URL')

// Validate critical environment variables
export const validateEnv = () => {
  const critical = ['NEXT_PUBLIC_LIFF_ID', 'NEXT_PUBLIC_API_URL']
  let valid = true

  critical.forEach(key => {
    if (!process.env[key]) {
      console.error(`Missing critical environment variable: ${key}`)
      valid = false
    }
  })

  return valid
}

// Debug function to print available environment variables (not values)
export const debugEnv = () => {
  if (typeof process !== 'undefined' && process.env) {
    console.log('Available environment variables:', 
      Object.keys(process.env)
        .filter(key => key.startsWith('NEXT_PUBLIC_'))
        .join(', ')
    )
  }
}