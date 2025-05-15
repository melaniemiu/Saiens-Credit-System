export function parseJWT(token: string): any {
  try {
    // JWT has three parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    // The payload is the second part
    const payload = parts[1]
    
    // Base64 decode - use different method for server/client compatibility
    let decoded: string
    
    if (typeof window === 'undefined') {
      // Server-side (Node.js)
      decoded = Buffer.from(payload, 'base64').toString('utf-8')
    } else {
      // Client-side
      decoded = atob(payload)
    }
    
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to parse JWT:', error)
    return null
  }
}

export function isJWTExpired(token: string): boolean {
  try {
    const payload = parseJWT(token)
    
    if (!payload || !payload.exp) {
      console.log('No expiration in JWT payload')
      return true // Consider invalid tokens as expired
    }
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp < currentTime
    
    if (isExpired) {
      console.log('JWT expired at:', new Date(payload.exp * 1000))
    }
    
    return isExpired
  } catch (error) {
    console.error('JWT verification failed:', error)
    return true // Consider failed verification as expired
  }
}