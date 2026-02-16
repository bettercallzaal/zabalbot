import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { getActivitySince } from '../tracker.ts';

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
      const activity = getActivitySince(24);

      if (activity.contributors.size === 0) {
        await callback({
          text: 'No activity tracked yet. I silently observe messages in the background — give it some time and I\'ll have contributor data for you.',
          actions: ['WHO_ACTIVE'],
          source: message.content.source,
        });
        return;
      }

      const sorted = [...activity.contributors.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      const lines: string[] = [];
      lines.push('**Community Pulse — Last 24h**');
      lines.push(`${activity.contributors.size} unique contributors, ${activity.totalMessages} total messages`);
      lines.push('');

      for (let i = 0; i < sorted.length; i++) {
        const [name, count] = sorted[i];
        lines.push(`${i + 1}. **${name}** — ${count} message${count > 1 ? 's' : ''}`);
      }

      if (activity.contributors.size > 15) {
        lines.push(`  ...and ${activity.contributors.size - 15} more`);
      }

      await callback({
        text: lines.join('\n'),
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
          text: '**Community Pulse — Last 24h**\n5 unique contributors, 34 total messages\n\n1. **alice** — 12 messages\n2. **bob** — 8 messages\n3. **charlie** — 6 messages',
          actions: ['WHO_ACTIVE'],
        },
      },
    ],
  ],
};
