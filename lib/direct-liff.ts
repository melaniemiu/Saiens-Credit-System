"use client"

// This is the most direct, simplified LIFF implementation
// with minimal code and maximum reliability for mobile
import liff from '@line/liff'

// LIFF ID hardcoded for maximum reliability on mobile
const LIFF_ID = "2007394904-dYXDv6o9"

// Simplified initialization
export function initializeOnce(): Promise<void> {
  return liff.init({ liffId: LIFF_ID })
}

// Get profile with no fancy error handling
export async function getProfile() {
  return await liff.getProfile()
}

// Get ID token with no fancy error handling
export function getIdToken(): string | null {
  try {
    return liff.getIDToken()
  } catch (e) {
    return null
  }
}

// Check if in Line app browser
export function isInLiffBrowser(): boolean {
  try {
    return liff.isInClient()
  } catch (e) {
    return false
  }
}

export { liff }