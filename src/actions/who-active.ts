import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { getActivitySince } from '../tracker.ts';
import { fetchFarcasterRecapData } from '../api/farcaster.ts';
import { formatActive } from '../formatters/active-formatter.ts';

export const whoActiveAction: Action = {
  name: 'WHO_ACTIVE',
  similes: ['ACTIVE_USERS', 'CONTRIBUTORS', 'WHO_IS_HERE', 'COMMUNITY_PULSE'],
  description:
    'Shows who has been most active in the community recently — contributor names and message counts',

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State
  ): Promise<boolean> => {
    const text = (message.content?.text ?? '').toLowerCase();
    const activeKeywords = [
      'who\'s active', 'whos active', 'who is active', 'who has been active',
      'who\'s been active', 'whos been active', 'active contributors',
      'who\'s talking', 'whos talking', 'who is talking', 'community pulse',
      'who\'s around', 'whos around', 'who is around',
    ];
    return activeKeywords.some((k) => text.includes(k));
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
      const [discord, farcaster] = await Promise.all([
        Promise.resolve(getActivitySince(24)),
        fetchFarcasterRecapData(),
      ]);

      const text = formatActive({ discord, farcaster });

      await callback({
        text,
        actions: ['WHO_ACTIVE'],
        source: message.content.source,
      });
    } catch (error) {
      logger.error('Error in WHO_ACTIVE action:', error);
      throw error;
    }
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: "Who's been active today?" } },
      {
        name: '{{name2}}',
        content: {
          text: '**Community Pulse — Last 24h**\n\n**Discord** — 5 contributors, 34 messages\n1. **alice** — 12 messages\n2. **bob** — 8 messages\n\n**Farcaster** — 3 casters, 10 casts\n1. **@zabal** — 4 casts',
          actions: ['WHO_ACTIVE'],
        },
      },
    ],
  ],
};
