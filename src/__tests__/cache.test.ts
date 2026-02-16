import { describe, expect, it, beforeEach } from 'bun:test';
import { getCached, setCache, clearCache, evictExpired } from '../cache';

beforeEach(() => {
  clearCache();
});

describe('Cache Layer', () => {
  it('stores and retrieves values', () => {
    setCache('key1', { value: 42 });
    expect(getCached<{ value: number }>('key1', 60_000)).toEqual({ value: 42 });
  });

  it('returns null for missing keys', () => {
    expect(getCached('nonexistent', 60_000)).toBeNull();
  });

  it('returns null for expired entries', async () => {
    setCache('key2', 'hello');
    // Wait a tiny bit and use a very short TTL
    await new Promise((r) => setTimeout(r, 10));
    expect(getCached('key2', 1)).toBeNull(); // 1ms TTL — already expired
  });

  it('returns value within TTL', () => {
    setCache('key3', 'still fresh');
    expect(getCached<string>('key3', 10_000)).toBe('still fresh');
  });

  it('overwrites existing keys', () => {
    setCache('key4', 'v1');
    setCache('key4', 'v2');
    expect(getCached<string>('key4', 60_000)).toBe('v2');
  });

  it('clearCache removes all entries', () => {
    setCache('a', 1);
    setCache('b', 2);
    clearCache();
    expect(getCached('a', 60_000)).toBeNull();
    expect(getCached('b', 60_000)).toBeNull();
  });

  it('evictExpired removes old entries and returns count', async () => {
    setCache('fresh', 'yes');
    setCache('stale', 'yes');
    await new Promise((r) => setTimeout(r, 10));
    setCache('fresh', 'refreshed'); // re-set to make fresh
    const evicted = evictExpired(5); // 5ms max age
    expect(evicted).toBeGreaterThanOrEqual(1);
    expect(getCached<string>('fresh', 60_000)).toBe('refreshed');
  });
});
