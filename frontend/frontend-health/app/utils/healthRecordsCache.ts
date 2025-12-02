import { cacheManager, CACHE_DURATION } from "./cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface ChatMessage {
  id: string;
  image_url: string | null;
  message: string;
  timestamp: string;
  is_user: boolean;
}

export interface HealthRecordsData {
  messages: ChatMessage[];
  fetchedAt: number;
}

// Extended cache key for health records
export const HEALTH_RECORDS_CACHE_KEY = "health_records_data";

/**
 * Fetches health records from the backend API
 */
export async function fetchHealthRecords(): Promise<ChatMessage[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/chat/history/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching health records:", error);
    throw error;
  }
}

/**
 * Gets health records from cache or fetches if not available
 * Returns cached data immediately and optionally fetches fresh data in background
 */
export async function getHealthRecords(
  forceRefresh: boolean = false
): Promise<{ data: ChatMessage[]; fromCache: boolean }> {
  // Check cache first
  if (!forceRefresh) {
    const cachedData = cacheManager.get<HealthRecordsData>(
      HEALTH_RECORDS_CACHE_KEY
    );

    if (cachedData?.messages) {
      return {
        data: cachedData.messages,
        fromCache: true,
      };
    }
  }

  // Fetch fresh data
  const freshData = await fetchHealthRecords();

  // Cache the fresh data
  cacheHealthRecords(freshData);

  return {
    data: freshData,
    fromCache: false,
  };
}

/**
 * Caches health records data
 */
export function cacheHealthRecords(messages: ChatMessage[]): void {
  const healthRecordsData: HealthRecordsData = {
    messages,
    fetchedAt: Date.now(),
  };

  cacheManager.set(
    HEALTH_RECORDS_CACHE_KEY,
    healthRecordsData,
    CACHE_DURATION.LONG // Use longer cache duration for health records
  );
}

/**
 * Invalidates health records cache
 * Call this after creating new chat messages
 */
export function invalidateHealthRecordsCache(): void {
  cacheManager.clear(HEALTH_RECORDS_CACHE_KEY);
}

/**
 * Prefetches health records in the background
 * This can be called on app initialization to warm up the cache
 */
export async function prefetchHealthRecords(): Promise<void> {
  try {
    const freshData = await fetchHealthRecords();
    cacheHealthRecords(freshData);
  } catch (error) {
    console.error("Error prefetching health records:", error);
    // Don't throw - prefetch failures should be silent
  }
}

/**
 * Gets health records with smart caching strategy:
 * 1. Return cached data immediately if available
 * 2. Fetch fresh data in background
 * 3. Update cache with fresh data
 */
export async function getHealthRecordsWithBackgroundRefresh(): Promise<{
  cachedData: ChatMessage[] | null;
  freshDataPromise: Promise<ChatMessage[]>;
}> {
  // Get cached data immediately
  const cached = cacheManager.get<HealthRecordsData>(HEALTH_RECORDS_CACHE_KEY);
  const cachedData = cached?.messages || null;

  // Start background fetch
  const freshDataPromise = (async () => {
    try {
      const freshData = await fetchHealthRecords();
      cacheHealthRecords(freshData);
      return freshData;
    } catch (error) {
      console.error("Error refreshing health records in background:", error);
      // If background refresh fails, return cached data if available
      if (cachedData) {
        return cachedData;
      }
      throw error;
    }
  })();

  return {
    cachedData,
    freshDataPromise,
  };
}
