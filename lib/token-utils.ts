import { clearAuthStorage } from './auth';

export function getAuthToken(): string | null {
  // Check both sessionStorage and localStorage
  const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
  return token;
}

export function checkTokenExpiry(): boolean {
  const token = getAuthToken();
  
  if (!token) {
    return false; // No token means not authenticated
  }
  
  try {
    // Parse JWT manually to check expiration
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    if (!payload.exp) {
      return false;
    }
    
    // Check if expired
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < currentTime;
    
    if (isExpired) {
      console.log('Token expired, clearing storage');
      clearAuthStorage();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return false;
  }
}

export function getTokenTimeRemaining(): number {
  const token = getAuthToken();
  
  if (!token) {
    return 0;
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return 0;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    if (!payload.exp) {
      return 0;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = payload.exp - currentTime;
    
    return Math.max(0, timeRemaining);
  } catch (error) {
    console.error('Error getting token time remaining:', error);
    return 0;
  }
}