import type { Action, Content, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { TOKENS } from '../constants.ts';
import { fetchTokenData, formatTokenResponse } from '../api/dexscreener.ts';

export function detectToken(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes('zabal') || lower.includes('$zabal')) return 'ZABAL';
  return null;
}

export const tokenInfoAction: Action = {
  name: 'TOKEN_INFO',
  similes: ['CHECK_PRICE', 'TOKEN_PRICE', 'ZABAL_PRICE', 'PRICE_CHECK'],
  description:
    'Fetches live token data (price, volume, market cap) for ZABAL from DexScreener',

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State
  ): Promise<boolean> => {
    const text = (message.content?.text ?? '').toLowerCase();
    const priceKeywords = ['price', 'token', 'market', 'volume', 'mcap', 'chart', 'dex', 'how much', 'worth', 'trading', 'liquidity'];
    const tokenMentioned = text.includes('zabal');
    const priceAsked = priceKeywords.some((k) => text.includes(k));
    return tokenMentioned && priceAsked;
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      const text = message.content?.text ?? '';
      const tokenKey = detectToken(text);
      const tokensToFetch = tokenKey ? [tokenKey] : ['ZABAL'];
      const results: string[] = [];

      for (const key of tokensToFetch) {
        const token = TOKENS[key];
        if (!token) continue;
        const pair = await fetchTokenData(token.address);
        if (pair) {
          results.push(formatTokenResponse(pair, token.symbol));
        } else {
          results.push(`Could not fetch data for ${token.symbol}. DexScreener may be temporarily unavailable.`);
        }
      }

      const responseContent: Content = {
        text: results.join('\n\n'),
        actions: ['TOKEN_INFO'],
        source: message.content.source,
      };

      await callback(responseContent);
    } catch (error) {
      logger.error('Error in TOKEN_INFO action:', error);
      throw error;
    }
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: "What's the ZABAL price?" } },
      {
        name: '{{name2}}',
        content: {
          text: '**$ZABAL Live Data**\nPrice: $0.00001234\n24h Change: +5.23%\nMarket Cap: $1.23M',
          actions: ['TOKEN_INFO'],
        },
      },
    ],
  ],
};
