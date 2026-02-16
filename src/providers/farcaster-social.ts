import type { IAgentRuntime, Memory, Provider, ProviderResult, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { fetchFarcasterCasts } from '../api/farcaster.ts';

export const farcasterSocialProvider: Provider = {
  name: 'FARCASTER_SOCIAL_PROVIDER',
  description: 'Surfaces recent Farcaster casts about ZABAL for social context',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    if (!process.env.FARCASTER_NEYNAR_API_KEY) {
      return { text: '', values: {}, data: {} };
    }

    try {
      const casts = await fetchFarcasterCasts('zabal');
      if (casts.length === 0) {
        return { text: '', values: {}, data: {} };
      }

      const lines: string[] = ['Recent Farcaster activity mentioning ZABAL:'];
      for (const cast of casts) {
        const likes = cast.reactions?.likes_count ?? 0;
        const recasts = cast.reactions?.recasts_count ?? 0;
        lines.push(
          `- @${cast.author.username}: "${cast.text.slice(0, 120)}${cast.text.length > 120 ? '...' : ''}" (${likes} likes, ${recasts} recasts)`
        );
      }

      return {
        text: lines.join('\n'),
        values: { castCount: String(casts.length) },
        data: { casts },
      };
    } catch (err) {
      logger.error('Farcaster social provider error:', err);
      return { text: '', values: {}, data: {} };
    }
  },
};
