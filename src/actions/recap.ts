import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { getActivitySince } from '../tracker.ts';
import { fetchFarcasterRecapData } from '../api/farcaster.ts';
import { fetchEmpireLeaderboard } from '../api/empire.ts';
import { formatRecap } from '../formatters/recap-formatter.ts';

function parseHoursFromText(text: string): number {
  const lower = text.toLowerCase();
  if (lower.includes('last hour') || lower.includes('past hour')) return 1;
  if (lower.includes('last 2') || lower.includes('past 2')) return 2;
  if (lower.includes('last 4') || lower.includes('past 4')) return 4;
  if (lower.includes('last 6') || lower.includes('past 6')) return 6;
  if (lower.includes('last 12') || lower.includes('past 12')) return 12;
  return 24;
}

export const recapAction: Action = {
  name: 'COMMUNITY_RECAP',
  similes: ['RECAP', 'SUMMARY', 'DIGEST', 'WHAT_HAPPENED', 'DAILY_RECAP', 'ACTIVITY_SUMMARY'],
  description:
    'Generates a community activity recap — who has been active, what topics are trending, links shared, and message volume.',

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State
  ): Promise<boolean> => {
    const text = (message.content?.text ?? '').toLowerCase();
    const recapKeywords = [
      'recap', 'summary', 'digest', 'what happened', 'what did i miss',
      'catch me up', 'activity', 'who has been', 'who\'s been', 'whos been',
      'today so far', 'update me', 'bring me up to speed',
    ];
    return recapKeywords.some((k) => text.includes(k));
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
      const hours = parseHoursFromText(message.content?.text ?? '');

      const [discord, farcaster, leaderboard] = await Promise.all([
        Promise.resolve(getActivitySince(hours)),
        fetchFarcasterRecapData(),
        fetchEmpireLeaderboard(5),
      ]);

      const text = formatRecap(hours, { discord, farcaster, leaderboard });

      await callback({
        text,
        actions: ['COMMUNITY_RECAP'],
        source: message.content.source,
      });
    } catch (error) {
      logger.error('Error in COMMUNITY_RECAP action:', error);
      throw error;
    }
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: '@ZABAL recap' } },
      {
        name: '{{name2}}',
        content: {
          text: '**Community Recap — Last 24h**\n\n**Discord Activity** — 47 messages\nTop contributors:\n  - alice: 12 messages\n  - bob: 8 messages\n\n**Farcaster Mentions** — 15 casts found\nActive casters:\n  - @zabal: 5 casts',
          actions: ['COMMUNITY_RECAP'],
        },
      },
    ],
    [
      { name: '{{name1}}', content: { text: 'What did I miss today?' } },
      {
        name: '{{name2}}',
        content: {
          text: '**Community Recap — Last 24h**\n\n**Farcaster Mentions** — 8 casts found\nActive casters:\n  - @songjam: 3 casts\n\n*Discord tracking builds over time — the longer I run, the richer the Discord data.*',
          actions: ['COMMUNITY_RECAP'],
        },
      },
    ],
  ],
};
