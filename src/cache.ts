interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store: Record<string, CacheEntry<unknown>> = {};

export function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = store[key];
  if (entry && Date.now() - entry.timestamp < ttlMs) {
    return entry.data as T;
  }
  if (entry) {
    delete store[key]; // Evict expired entries
  }
  return null;
}

export function setCache<T>(key: string, data: T): void {
  store[key] = { data, timestamp: Date.now() };
}

/** Remove all expired entries. Call periodically to prevent unbounded growth. */
export function evictExpired(maxAgMs: number): number {
  const now = Date.now();
  let evicted = 0;
  for (const key of Object.keys(store)) {
    if (now - store[key].timestamp > maxAgMs) {
      delete store[key];
      evicted++;
    }
  }
  return evicted;
}

/** Clear all cache entries. Useful for testing. */
export function clearCache(): void {
  for (const key of Object.keys(store)) {
    delete store[key];
  }
}
