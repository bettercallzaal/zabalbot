import type { IAgentRuntime, Memory, Provider, ProviderResult, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { TOKENS } from '../constants.ts';
import { fetchTokenData } from '../api/dexscreener.ts';

export const tokenDataProvider: Provider = {
  name: 'TOKEN_DATA_PROVIDER',
  description: 'Provides live ZABAL and SANG token data as background context for all responses',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    try {
      const [zabalPair, sangPair] = await Promise.all([
        fetchTokenData(TOKENS.ZABAL.address),
        fetchTokenData(TOKENS.SANG.address),
      ]);

      const lines: string[] = ['Current token data (live from DexScreener):'];

      if (zabalPair) {
        const zPrice = parseFloat(zabalPair.priceUsd);
        const zChange = zabalPair.priceChange?.h24 ?? 0;
        lines.push(
          `$ZABAL: $${zPrice < 0.01 ? zPrice.toFixed(8) : zPrice.toFixed(4)} (${zChange >= 0 ? '+' : ''}${zChange.toFixed(2)}% 24h)`
        );
      }

      if (sangPair) {
        const sPrice = parseFloat(sangPair.priceUsd);
        const sChange = sangPair.priceChange?.h24 ?? 0;
        lines.push(
          `$SANG: $${sPrice < 0.01 ? sPrice.toFixed(8) : sPrice.toFixed(4)} (${sChange >= 0 ? '+' : ''}${sChange.toFixed(2)}% 24h)`
        );
      }

      if (!zabalPair && !sangPair) {
        return { text: '', values: {}, data: {} };
      }

      return {
        text: lines.join('\n'),
        values: {
          zabalPrice: zabalPair?.priceUsd ?? 'unavailable',
          sangPrice: sangPair?.priceUsd ?? 'unavailable',
        },
        data: { zabal: zabalPair ?? null, sang: sangPair ?? null },
      };
    } catch (err) {
      logger.error('Token data provider error:', err);
      return { text: '', values: {}, data: {} };
    }
  },
};
