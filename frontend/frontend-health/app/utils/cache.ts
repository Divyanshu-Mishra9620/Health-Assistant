interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheManager {
  private readonly cache: Map<string, CacheEntry<any>> = new Map();
  private readonly isBrowser = globalThis.window !== undefined;

  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });

    if (this.isBrowser) {
      try {
        localStorage.setItem(
          `cache_${key}`,
          JSON.stringify({
            data,
            timestamp: Date.now(),
            expiresIn,
          })
        );
      } catch (e) {
        console.warn("Failed to store cache in localStorage:", e);
      }
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry) {
      const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
      if (isExpired) {
        this.cache.delete(key);
        return null;
      }
      return entry.data as T;
    }

    if (this.isBrowser) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const parsedEntry = JSON.parse(stored);
          const isExpired =
            Date.now() - parsedEntry.timestamp > parsedEntry.expiresIn;
          if (isExpired) {
            localStorage.removeItem(`cache_${key}`);
            return null;
          }
          this.cache.set(key, parsedEntry);
          return parsedEntry.data as T;
        }
      } catch (e) {
        console.warn("Failed to retrieve cache from localStorage:", e);
      }
    }

    return null;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
      return !isExpired;
    }

    if (this.isBrowser) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const parsedEntry = JSON.parse(stored);
          const isExpired =
            Date.now() - parsedEntry.timestamp > parsedEntry.expiresIn;
          return !isExpired;
        }
      } catch (e) {
        console.warn("Failed to check cache in localStorage:", e);
      }
    }

    return false;
  }

  clear(key: string): void {
    this.cache.delete(key);
    if (this.isBrowser) {
      localStorage.removeItem(`cache_${key}`);
    }
  }

  clearAll(): void {
    this.cache.clear();
    if (this.isBrowser) {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith("cache_")) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  stats() {
    return {
      memorySize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
    };
  }
}

export const cacheManager = new CacheManager();

export const CACHE_KEYS = {
  CHAT_HISTORY: "chat_history",
  HEALTH_RECORDS: "health_records",
  USER_PROFILE: "user_profile",
  CHAT_SESSIONS: "chat_sessions",
} as const;

export const CACHE_DURATION = {
  SHORT: 1 * 60 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 30 * 60 * 1000,
  EXTENDED: 60 * 60 * 1000,
} as const;
