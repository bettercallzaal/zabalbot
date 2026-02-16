import { logger } from '@elizaos/core';
import { getCached, setCache } from '../cache.ts';
import { CACHE_TTL } from '../constants.ts';

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  txns: { h24: { buys: number; sells: number } };
  volume: { h24: number };
  priceChange: { h24: number };
  liquidity: { usd: number };
  fdv: number;
  marketCap: number;
}

export async function fetchTokenData(address: string): Promise<DexScreenerPair | null> {
  const cacheKey = `dexscreener_${address}`;
  const cached = getCached<DexScreenerPair>(cacheKey, CACHE_TTL.DEXSCREENER);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    if (!res.ok) {
      logger.error(`DexScreener API error: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = (await res.json()) as { pairs?: DexScreenerPair[] };
    const pairs = data.pairs;
    if (!pairs || pairs.length === 0) return null;

    const best = pairs.reduce((a, b) => ((a.liquidity?.usd ?? 0) > (b.liquidity?.usd ?? 0) ? a : b));
    setCache(cacheKey, best);
    return best;
  } catch (err) {
    logger.error('DexScreener fetch failed:', err);
    return null;
  }
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toFixed(2);
}

export function formatTokenResponse(pair: DexScreenerPair, symbol: string): string {
  const price = parseFloat(pair.priceUsd);
  const change24h = pair.priceChange?.h24 ?? 0;
  const changeEmoji = change24h >= 0 ? '+' : '';
  const volume = pair.volume?.h24 ?? 0;
  const liquidity = pair.liquidity?.usd ?? 0;
  const mcap = pair.marketCap ?? pair.fdv ?? 0;
  const buys = pair.txns?.h24?.buys ?? 0;
  const sells = pair.txns?.h24?.sells ?? 0;

  return [
    `**${symbol} Live Data**`,
    `Price: $${price < 0.01 ? price.toFixed(8) : price.toFixed(4)}`,
    `24h Change: ${changeEmoji}${change24h.toFixed(2)}%`,
    `Market Cap: $${formatNumber(mcap)}`,
    `24h Volume: $${formatNumber(volume)}`,
    `Liquidity: $${formatNumber(liquidity)}`,
    `24h Txns: ${buys} buys / ${sells} sells`,
    `DEX: ${pair.dexId} on ${pair.chainId}`,
    `Chart: ${pair.url}`,
  ].join('\n');
}
