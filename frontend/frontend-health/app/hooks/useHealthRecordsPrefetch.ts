import { useEffect, useRef } from "react";
import { prefetchHealthRecords } from "../utils/healthRecordsCache";

/**
 * Custom hook to prefetch health records data in the background
 * This hook should be used in the main app component to warm up the cache
 * as soon as the user logs in
 */
export function useHealthRecordsPrefetch() {
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Only prefetch once per session
    if (hasPrefetched.current) {
      return;
    }

    // Check if user is authenticated
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      return;
    }

    // Prefetch health records in the background
    hasPrefetched.current = true;
    prefetchHealthRecords();
  }, []);
}
