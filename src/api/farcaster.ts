import { logger } from '@elizaos/core';
import { getCached, setCache } from '../cache.ts';
import { CACHE_TTL, FARCASTER_SEARCH_TERMS } from '../constants.ts';

export interface FarcasterCast {
  hash: string;
  author: { username: string; display_name: string };
  text: string;
  timestamp: string;
  reactions?: { likes_count: number; recasts_count: number };
}

export interface FarcasterSearchOptions {
  query?: string;
  sortType?: 'desc_chron' | 'algorithmic';
  limit?: number;
}

export interface FarcasterRecapData {
  mentionCasts: FarcasterCast[];
  channelCasts: FarcasterCast[];
  totalMentions: number;
  uniqueCasters: Map<string, number>;
  topCast: FarcasterCast | null;
}

// Search Farcaster casts — accepts string (backward-compatible) or options object
export async function fetchFarcasterCasts(
  options: FarcasterSearchOptions | string = 'zabal'
): Promise<FarcasterCast[]> {
  const opts: FarcasterSearchOptions =
    typeof options === 'string' ? { query: options } : options;

  const query = opts.query ?? 'zabal';
  const sortType = opts.sortType ?? 'desc_chron';
  const limit = opts.limit ?? 25;

  const apiKey = process.env.FARCASTER_NEYNAR_API_KEY;
  if (!apiKey) return [];

  const cacheKey = `farcaster_search_${query}_${sortType}_${limit}`;
  const cached = getCached<FarcasterCast[]>(cacheKey, CACHE_TTL.FARCASTER);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      q: query,
      sort_type: sortType,
      limit: String(limit),
    });

    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/cast/search?${params}`,
      { headers: { 'x-api-key': apiKey } }
    );
    if (!res.ok) {
      logger.error(`Neynar search API error: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = (await res.json()) as { result?: { casts?: FarcasterCast[] } };
    const casts = data.result?.casts ?? [];
    setCache(cacheKey, casts);
    return casts;
  } catch (err) {
    logger.error('Neynar search failed:', err);
    return [];
  }
}

// Fetch casts from specific Farcaster channels
export async function fetchFarcasterChannelFeed(
  channelIds: string[] = ['zabal'],
  limit: number = 15
): Promise<FarcasterCast[]> {
  const apiKey = process.env.FARCASTER_NEYNAR_API_KEY;
  if (!apiKey) return [];

  const ids = channelIds.join(',');
  const cacheKey = `farcaster_channel_${ids}_${limit}`;
  const cached = getCached<FarcasterCast[]>(cacheKey, CACHE_TTL.FARCASTER_CHANNEL);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=${encodeURIComponent(ids)}&limit=${limit}`,
      { headers: { 'x-api-key': apiKey } }
    );
    if (!res.ok) {
      logger.error(`Neynar channel feed error: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = (await res.json()) as { casts?: FarcasterCast[] };
    const casts = data.casts ?? [];
    setCache(cacheKey, casts);
    return casts;
  } catch (err) {
    logger.error('Neynar channel feed failed:', err);
    return [];
  }
}

// Aggregated Farcaster data for recaps — search + channel feed, deduped
export async function fetchFarcasterRecapData(): Promise<FarcasterRecapData | null> {
  const apiKey = process.env.FARCASTER_NEYNAR_API_KEY;
  if (!apiKey) return null;

  try {
    const searchQuery = FARCASTER_SEARCH_TERMS.join(' OR ');

    const [mentionCasts, channelCasts] = await Promise.all([
      fetchFarcasterCasts({
        query: searchQuery,
        sortType: 'algorithmic',
        limit: 25,
      }),
      fetchFarcasterChannelFeed(['zabal'], 15),
    ]);

    // Deduplicate by hash
    const seen = new Set<string>();
    const allCasts: FarcasterCast[] = [];
    for (const cast of [...mentionCasts, ...channelCasts]) {
      if (!seen.has(cast.hash)) {
        seen.add(cast.hash);
        allCasts.push(cast);
      }
    }

    // Compute unique casters
    const uniqueCasters = new Map<string, number>();
    for (const cast of allCasts) {
      const username = cast.author?.username ?? 'unknown';
      uniqueCasters.set(username, (uniqueCasters.get(username) ?? 0) + 1);
    }

    // Find top cast by engagement (recasts weighted 2x)
    const topCast = allCasts.reduce<FarcasterCast | null>((best, cast) => {
      const score =
        (cast.reactions?.likes_count ?? 0) + (cast.reactions?.recasts_count ?? 0) * 2;
      const bestScore = best
        ? (best.reactions?.likes_count ?? 0) + (best.reactions?.recasts_count ?? 0) * 2
        : -1;
      return score > bestScore ? cast : best;
    }, null);

    return { mentionCasts, channelCasts, totalMentions: allCasts.length, uniqueCasters, topCast };
  } catch (err) {
    logger.error('Farcaster recap aggregation failed:', err);
    return null;
  }
}
