import { logger } from '@elizaos/core';
import { getCached, setCache } from '../cache.ts';
import { CACHE_TTL } from '../constants.ts';

export interface FarcasterCast {
  hash: string;
  author: { username: string; display_name: string };
  text: string;
  timestamp: string;
  reactions?: { likes_count: number; recasts_count: number };
}

export async function fetchFarcasterCasts(query: string): Promise<FarcasterCast[]> {
  const apiKey = process.env.FARCASTER_NEYNAR_API_KEY;
  if (!apiKey) return [];

  const cacheKey = `farcaster_${query}`;
  const cached = getCached<FarcasterCast[]>(cacheKey, CACHE_TTL.FARCASTER);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/cast/search?q=${encodeURIComponent(query)}&limit=5`,
      { headers: { 'x-api-key': apiKey } }
    );
    if (!res.ok) {
      logger.error(`Neynar API error: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = (await res.json()) as { result?: { casts?: FarcasterCast[] } };
    const casts = data.result?.casts ?? [];
    setCache(cacheKey, casts);
    return casts;
  } catch (err) {
    logger.error('Neynar fetch failed:', err);
    return [];
  }
}
