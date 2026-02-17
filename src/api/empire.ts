import { logger } from '@elizaos/core';
import { getCached, setCache } from '../cache.ts';
import { CACHE_TTL, TOKENS } from '../constants.ts';
import { formatNumber } from './dexscreener.ts';

const EMPIRE_BASE = 'https://www.empirebuilder.world/api';
const ZABAL_ADDRESS = TOKENS.ZABAL.address;

export interface EmpireData {
  treasury?: number;
  totalBurned?: number;
  totalDistributed?: number;
  distributions?: Array<{ amount: number; date: string; type: string }>;
  [key: string]: any;
}

export interface LeaderboardEntry {
  address: string;
  balance: string;
  baseBalance: string;
  appliedBoosts: Array<{
    boosterId: string;
    multiplier: number;
    type: string;
    contractAddress: string;
  }>;
  finalMultiplier: number;
  isLP: boolean;
  farcasterUsername: string | null;
  rank: number;
}

export interface EmpireBooster {
  id: string;
  type: string;
  contractAddress: string;
  multiplier: number;
  requirement?: { minAmount: string };
  token_symbol?: string;
  token_name?: string;
  token_image_url?: string;
  chainId?: number;
  [key: string]: any;
}

// Shared headers — includes API key when available
function empireHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const apiKey = process.env.EMPIRE_BUILDER_API_KEY;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
}

export async function fetchEmpireData(): Promise<EmpireData | null> {
  const cacheKey = 'empire_zabal';
  const cached = getCached<EmpireData>(cacheKey, CACHE_TTL.EMPIRE);
  if (cached) return cached;

  try {
    const res = await fetch(
      `${EMPIRE_BASE}/empires/${ZABAL_ADDRESS}`,
      { headers: empireHeaders() }
    );
    if (!res.ok) {
      logger.error(`Empire Builder API error: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    setCache(cacheKey, data);
    return data as EmpireData;
  } catch (err) {
    logger.error('Empire Builder fetch failed:', err);
    return null;
  }
}

export async function fetchEmpireLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const cacheKey = `empire_leaderboard_${limit}`;
  const cached = getCached<LeaderboardEntry[]>(cacheKey, CACHE_TTL.EMPIRE_LEADERBOARD);
  if (cached) return cached;

  try {
    const res = await fetch(
      `${EMPIRE_BASE}/leaderboard/${ZABAL_ADDRESS}`,
      { headers: empireHeaders() }
    );
    if (!res.ok) {
      logger.error(`Empire leaderboard API error: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = (await res.json()) as Record<string, any>;
    const holders: LeaderboardEntry[] = data.holders ?? [];
    const sliced = holders.slice(0, limit);
    setCache(cacheKey, sliced);
    return sliced;
  } catch (err) {
    logger.error('Empire leaderboard fetch failed:', err);
    return [];
  }
}

export async function fetchEmpireBoosters(): Promise<EmpireBooster[]> {
  const cacheKey = 'empire_boosters';
  const cached = getCached<EmpireBooster[]>(cacheKey, CACHE_TTL.EMPIRE_BOOSTERS);
  if (cached) return cached;

  try {
    const res = await fetch(
      `${EMPIRE_BASE}/boosters/${ZABAL_ADDRESS}`,
      { headers: empireHeaders() }
    );
    if (!res.ok) {
      logger.error(`Empire boosters API error: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = (await res.json()) as Record<string, any>;
    const boosters: EmpireBooster[] = data.boosters ?? [];
    setCache(cacheKey, boosters);
    return boosters;
  } catch (err) {
    logger.error('Empire boosters fetch failed:', err);
    return [];
  }
}

function abbreviateAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatEmpireResponse(data: EmpireData): string {
  const lines: string[] = ['**ZABAL Empire Builder Metrics**'];

  if (data.treasury !== undefined) {
    lines.push(`Treasury: $${formatNumber(data.treasury)}`);
  }
  if (data.totalBurned !== undefined) {
    lines.push(`Total Burned: $${formatNumber(data.totalBurned)}`);
  }
  if (data.totalDistributed !== undefined) {
    lines.push(`Total Distributed: $${formatNumber(data.totalDistributed)}`);
  }

  const knownKeys = new Set(['treasury', 'totalBurned', 'totalDistributed', 'distributions']);
  for (const [key, value] of Object.entries(data)) {
    if (!knownKeys.has(key) && typeof value === 'number') {
      lines.push(`${key}: ${formatNumber(value)}`);
    } else if (!knownKeys.has(key) && typeof value === 'string') {
      lines.push(`${key}: ${value}`);
    }
  }

  if (data.distributions && data.distributions.length > 0) {
    lines.push('', '**Recent Distributions:**');
    for (const d of data.distributions.slice(0, 5)) {
      lines.push(`  - ${d.type}: $${formatNumber(d.amount)} (${d.date})`);
    }
  }

  lines.push('', 'Source: Empire Builder — 80% of trading fees to creator, built on Clanker v4');
  return lines.join('\n');
}

function formatBalance(balanceStr: string): string {
  // Balance is in wei-like string — convert to human readable
  const num = Number(balanceStr);
  if (isNaN(num) || num === 0) return '0';
  // Assume 18 decimals (standard ERC20)
  const humanReadable = num / 1e18;
  return formatNumber(humanReadable);
}

export function formatLeaderboardResponse(entries: LeaderboardEntry[]): string {
  if (entries.length === 0) return '';

  const lines: string[] = ['**Empire Leaderboard — Top Holders**'];
  for (const e of entries) {
    const name = e.farcasterUsername || abbreviateAddress(e.address);
    const parts = [`${e.rank}. **${name}**`];
    parts.push(`Balance: ${formatBalance(e.balance)}`);
    if (e.finalMultiplier > 1) parts.push(`Boost: ${e.finalMultiplier}x`);
    lines.push(parts.join(' — '));
  }
  return lines.join('\n');
}
