"use client"

import liff from '@line/liff'

// LIFF ID is hardcoded here as a fallback
const LIFF_ID = "2007394904-dYXDv6o9"

// Track initialization state
let isInitialized = false
let isInitializing = false
let initPromise: Promise<boolean> | null = null

// Callbacks for successful initialization
const successCallbacks: (() => void)[] = []

// Function to initialize LIFF using window.onload pattern
export function initLiff(): Promise<boolean> {
  // If already initialized, return resolved promise
  if (isInitialized) {
    console.log("LIFF already initialized, returning success")
    return Promise.resolve(true)
  }

  // If initialization in progress, return existing promise
  if (isInitializing && initPromise) {
    console.log("LIFF initialization already in progress, returning existing promise")
    return initPromise
  }

  // Start initialization
  console.log("Starting new LIFF initialization")
  isInitializing = true

  // Create a new promise for initialization
  initPromise = new Promise<boolean>((resolve) => {
    const performInit = () => {
      console.log("Now performing LIFF initialization with ID:", LIFF_ID)
      
      // Simple retrying mechanism
      const attemptInit = (retryCount = 0) => {
        liff.init({ liffId: LIFF_ID })
          .then(() => {
            console.log("✅ LIFF initialized successfully")
            isInitialized = true
            isInitializing = false
            
            // Call success callbacks
            successCallbacks.forEach(callback => {
              try {
                callback()
              } catch (e) {
                console.error("Error in LIFF init callback:", e)
              }
            })
            
            resolve(true)
          })
          .catch((err) => {
            console.error(`❌ LIFF initialization error (attempt ${retryCount + 1}):`, err)
            
            if (retryCount < 2) {
              console.log(`Retrying LIFF initialization in ${(retryCount + 1) * 1000}ms...`)
              setTimeout(() => attemptInit(retryCount + 1), (retryCount + 1) * 1000)
            } else {
              console.error("Failed to initialize LIFF after multiple attempts")
              isInitializing = false
              resolve(false)
            }
          })
      }
      
      // Start initialization
      attemptInit()
    }
    
    // Use window.onload for mobile compatibility
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        // Document already loaded
        console.log("Document already loaded, initializing LIFF immediately")
        performInit()
      } else {
        // Wait for window to load
        console.log("Setting up window.onload handler for LIFF initialization")
        const existingOnload = window.onload
        
        window.onload = function(e) {
          // Call existing handler if any
          if (existingOnload && typeof existingOnload === 'function') {
            (existingOnload as any)(e)
          }
          
          console.log("Window loaded, initializing LIFF")
          performInit()
        }
        
        // Backup timeout in case onload doesn't fire
        setTimeout(() => {
          if (!isInitialized) {
            console.log("Backup LIFF initialization after timeout")
            performInit()
          }
        }, 3000)
      }
    } else {
      // SSR environment
      resolve(false)
    }
  })
  
  return initPromise
}

// Register a callback to be called after successful initialization
export function onLiffInitialized(callback: () => void) {
  if (isInitialized) {
    // Already initialized, call immediately
    callback()
  } else {
    // Add to callback list
    successCallbacks.push(callback)
  }
}

// Check if in LINE browser (can be called before initialization)
export function isInLineBrowser(): boolean {
  try {
    return liff.isInClient()
  } catch (e) {
    console.error("Error checking if in LINE browser:", e)
    return false
  }
}

// Safe wrapper for LINE login
export function lineLogin() {
  initLiff().then(success => {
    if (success) {
      try {
        console.log("Triggering LIFF login")
        liff.login()
      } catch (e) {
        console.error("Error during LIFF login:", e)
        fallbackLogin()
      }
    } else {
      fallbackLogin()
    }
  })
}

// Fallback login method using direct URL
export function fallbackLogin() {
  console.log("Using fallback login method")
  const redirectUri = encodeURIComponent(window.location.origin)
  window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LIFF_ID}&redirect_uri=${redirectUri}&state=123456&scope=profile%20openid&nonce=${Date.now()}`
}

// Export LIFF instance for direct access if needed
export { liff }