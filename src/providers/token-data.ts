import type { IAgentRuntime, Memory, Provider, ProviderResult, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { TOKENS } from '../constants.ts';
import { fetchTokenData } from '../api/dexscreener.ts';

export const tokenDataProvider: Provider = {
  name: 'TOKEN_DATA_PROVIDER',
  description: 'Provides live ZABAL token data as background context for all responses',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    try {
      const zabalPair = await fetchTokenData(TOKENS.ZABAL.address);

      const lines: string[] = ['Current token data (live from DexScreener):'];

      if (zabalPair) {
        const zPrice = parseFloat(zabalPair.priceUsd);
        const zChange = zabalPair.priceChange?.h24 ?? 0;
        lines.push(
          `$ZABAL: $${zPrice < 0.01 ? zPrice.toFixed(8) : zPrice.toFixed(4)} (${zChange >= 0 ? '+' : ''}${zChange.toFixed(2)}% 24h)`
        );
      }

      if (!zabalPair) {
        return { text: '', values: {}, data: {} };
      }

      return {
        text: lines.join('\n'),
        values: {
          zabalPrice: zabalPair?.priceUsd ?? 'unavailable',
        },
        data: { zabal: zabalPair ?? null },
      };
    } catch (err) {
      logger.error('Token data provider error:', err);
      return { text: '', values: {}, data: {} };
    }
  },
};
