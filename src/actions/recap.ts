import type { Action, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { getActivitySince } from '../tracker.ts';

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
      const activity = getActivitySince(hours);

      if (activity.totalMessages === 0) {
        await callback({
          text: `No activity tracked in the last ${hours} hour${hours > 1 ? 's' : ''}. I silently observe messages in the background — the longer I run, the richer the recaps get.`,
          actions: ['COMMUNITY_RECAP'],
          source: message.content.source,
        });
        return;
      }

      const lines: string[] = [];
      lines.push(`**Community Recap — Last ${hours}h**`);
      lines.push(`Total messages tracked: ${activity.totalMessages}`);
      lines.push('');

      const sortedContributors = [...activity.contributors.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      if (sortedContributors.length > 0) {
        lines.push('**Active Contributors:**');
        for (const [name, count] of sortedContributors) {
          lines.push(`  - ${name}: ${count} message${count > 1 ? 's' : ''}`);
        }
        lines.push('');
      }

      if (activity.topTopics.length > 0) {
        lines.push('**Trending Topics:**');
        for (const [topic, count] of activity.topTopics) {
          lines.push(`  - ${topic}: ${count} mention${count > 1 ? 's' : ''}`);
        }
        lines.push('');
      }

      const uniqueLinks = [...new Set(activity.links)].slice(0, 5);
      if (uniqueLinks.length > 0) {
        lines.push('**Links Shared:**');
        for (const link of uniqueLinks) {
          lines.push(`  - ${link}`);
        }
        lines.push('');
      }

      const sortedChannels = [...activity.channelBreakdown.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      if (sortedChannels.length > 1) {
        lines.push('**Channel Activity:**');
        for (const [channelId, count] of sortedChannels) {
          lines.push(`  - <#${channelId}>: ${count} messages`);
        }
        lines.push('');
      }

      lines.push('*I track activity silently in the background. The longer I run, the richer these recaps get.*');

      await callback({
        text: lines.join('\n'),
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
          text: '**Community Recap — Last 24h**\nTotal messages tracked: 47\n\n**Active Contributors:**\n  - alice: 12 messages\n  - bob: 8 messages\n\n**Trending Topics:**\n  - zabal: 15 mentions\n  - music: 8 mentions',
          actions: ['COMMUNITY_RECAP'],
        },
      },
    ],
    [
      { name: '{{name1}}', content: { text: 'What did I miss today?' } },
      {
        name: '{{name2}}',
        content: {
          text: '**Community Recap — Last 24h**\nTotal messages tracked: 23\n\n**Active Contributors:**\n  - charlie: 9 messages\n\n**Trending Topics:**\n  - governance: 5 mentions',
          actions: ['COMMUNITY_RECAP'],
        },
      },
    ],
  ],
};
