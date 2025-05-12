// Simple cache utility for API responses
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // Expiry time in milliseconds
}

class ApiCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  
  // Set a value in the cache with an expiry time
  set<T>(key: string, data: T, expiryMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: expiryMs
    });
  }
  
  // Get a value from the cache, returns undefined if expired or not found
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // Return undefined if not found
    if (!item) {
      return undefined;
    }
    
    // Check if expired
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data as T;
  }
  
  // Check if key exists in cache and is not expired
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  // Remove a key from the cache
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  // Clear all cache
  clear(): void {
    this.cache.clear();
  }
}

// Create a singleton instance
export const apiCache = new ApiCache();