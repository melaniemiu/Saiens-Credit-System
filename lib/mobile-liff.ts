"use client"

import liff from '@line/liff'

// This file contains a simplified version of LIFF initialization specifically 
// designed for mobile environments

// The LIFF ID must be hardcoded to avoid problems with environment variables on mobile
const LIFF_ID = "2007394904-dYXDv6o9"

// Global initialization state
let isInitialized = false

// The most simplified approach to initialize LIFF on mobile
export function initLiffMobile(): Promise<boolean> {
  return new Promise((resolve) => {
    if (isInitialized) {
      console.log("LIFF already initialized")
      resolve(true)
      return
    }

    console.log("Mobile LIFF initializing...")

    // Simple initialization function
    const initSimple = () => {
      try {
        liff.init({ liffId: LIFF_ID })
          .then(() => {
            console.log("Mobile LIFF initialized successfully!")
            isInitialized = true
            resolve(true)
          })
          .catch(e => {
            console.error("Mobile LIFF initialization error:", e)
            // Resolve with false but don't reject
            resolve(false)
          })
      } catch (e) {
        console.error("Mobile LIFF general error:", e)
        resolve(false)
      }
    }

    // Check if document is fully loaded
    if (typeof document !== 'undefined') {
      if (document.readyState === 'complete') {
        console.log("Document already loaded, initializing mobile LIFF now")
        initSimple()
      } else {
        console.log("Waiting for window.onload for mobile LIFF")
        window.addEventListener('load', () => {
          console.log("Window loaded, initializing mobile LIFF now")
          initSimple()
        })
      }
    } else {
      // Fallback for SSR
      initSimple()
    }
  })
}

// Check if in LINE browser
export function isInLineBrowser(): boolean {
  try {
    return liff.isInClient()
  } catch (e) {
    return false
  }
}

// Get LINE profile with better error handling for mobile
export async function getLineProfile() {
  if (!isInitialized) {
    await initLiffMobile()
  }
  
  try {
    return await liff.getProfile()
  } catch (e) {
    console.error("Error getting LINE profile:", e)
    throw e
  }
}

// Get ID token with better error handling for mobile
export function getIdToken(): string | null {
  try {
    return liff.getIDToken()
  } catch (e) {
    console.error("Error getting ID token:", e)
    return null
  }
}

// Export LIFF instance for direct access if needed
export { liff }