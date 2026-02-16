import { logger } from '@elizaos/core';
import { getCached, setCache } from '../cache.ts';
import { CACHE_TTL, TOKENS } from '../constants.ts';
import { formatNumber } from './dexscreener.ts';

export interface EmpireData {
  treasury?: number;
  totalBurned?: number;
  totalDistributed?: number;
  distributions?: Array<{ amount: number; date: string; type: string }>;
  [key: string]: any;
}

export async function fetchEmpireData(): Promise<EmpireData | null> {
  const cacheKey = 'empire_zabal';
  const cached = getCached<EmpireData>(cacheKey, CACHE_TTL.EMPIRE);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://www.empirebuilder.world/api/empires/${TOKENS.ZABAL.address}`
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
