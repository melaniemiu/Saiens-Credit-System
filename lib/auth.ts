export interface LineUserProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
  email?: string
}

export interface AuthUser {
  id: string
  name: string
  email?: string
  picture?: string
  role: 'user' | 'admin'
  department?: string
  employeeId?: string
  creditsReceived?: number
  creditsGiven?: number
  remainingDailyCredits?: number
}

/**
 * Get LINE user profile
 */
export async function getLineUserProfile(): Promise<LineUserProfile | null> {
  try {
    // Import dynamically to avoid issues
    const liff = (await import('@line/liff')).default

    if (!liff.isLoggedIn()) {
      console.log('LINE user is not logged in')
      return null
    }

    console.log('Getting LINE profile...')
    const profile = await liff.getProfile()
    const idToken = liff.getDecodedIDToken()

    console.log('LINE profile retrieved successfully')
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
      email: idToken?.email
    }
  } catch (error) {
    console.error('Failed to get LINE profile:', error)
    return null
  }
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  // Check browser environment
  if (typeof window === 'undefined') {
    return false
  }

  // Check if we have a user session in storage (either session or local storage)
  const userFromSession = sessionStorage.getItem('user')
  const userFromLocal = localStorage.getItem('user')

  // Check if the auth token exists (import from api)
  const authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken')

  console.log("Auth check - User in session:", !!userFromSession)
  console.log("Auth check - User in local:", !!userFromLocal)
  console.log("Auth check - Auth token:", !!authToken)

  // Return true if any of these exist
  return !!(userFromSession || userFromLocal || authToken)
}

/**
 * Logout the current user
 */
export async function logout() {
  try {
    // Import dynamically
    const liffModule = await import('@line/liff')
    const liff = liffModule.default

    // Logout from LINE if logged in
    if (liff.isLoggedIn()) {
      console.log('Logging out from LINE...')
      liff.logout()
    }
  } catch (error) {
    console.error('Error during LINE logout:', error)
  }

  // Clear all browser storage
  console.log('Clearing all auth data from browser storage')

  // Session storage
  sessionStorage.removeItem('user')
  sessionStorage.removeItem('lineProfile')
  sessionStorage.removeItem('authToken')

  // Local storage
  localStorage.removeItem('user')
  localStorage.removeItem('lineProfile')
  localStorage.removeItem('authToken')

  // Additional items that might exist
  sessionStorage.removeItem('liff.state')
  localStorage.removeItem('liff.state')
  sessionStorage.removeItem('liff.auth.client_id')
  localStorage.removeItem('liff.auth.client_id')

  console.log("All auth data cleared from storage")

  // Note: No redirect here - we leave that to the auth-context logout function
  // to ensure proper coordination with the API call and React state updates
}

/**
 * Get the current user from session storage
 */
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  // Try to get user from either session storage or local storage
  const userJson = sessionStorage.getItem('user') || localStorage.getItem('user')
  if (!userJson) {
    return null
  }

  try {
    return JSON.parse(userJson) as AuthUser
  } catch (error) {
    console.error('Failed to parse user from storage:', error)
    return null
  }
}

/**
 * Set the current user in storage
 */
export function setCurrentUser(user: AuthUser) {
  const userJson = JSON.stringify(user)

  // Store in both session and local storage for persistence
  sessionStorage.setItem('user', userJson)
  localStorage.setItem('user', userJson)
  console.log("User data saved to storage")
}