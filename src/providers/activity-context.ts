import type { IAgentRuntime, Memory, Provider, ProviderResult, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { getActivitySince } from '../tracker.ts';

export const activityContextProvider: Provider = {
  name: 'ACTIVITY_CONTEXT_PROVIDER',
  description: 'Provides recent community activity context so ZABAL can reference it naturally in conversation',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    try {
      const activity = getActivitySince(6);

      if (activity.totalMessages === 0) {
        return { text: '', values: {}, data: {} };
      }

      const lines: string[] = ['Recent community activity (last 6h):'];
      lines.push(`${activity.totalMessages} messages from ${activity.contributors.size} contributors`);

      const topContribs = [...activity.contributors.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      if (topContribs.length > 0) {
        lines.push(`Most active: ${topContribs.map(([n, c]) => `${n} (${c})`).join(', ')}`);
      }

      if (activity.topTopics.length > 0) {
        lines.push(`Trending topics: ${activity.topTopics.map(([t]) => t).join(', ')}`);
      }

      return {
        text: lines.join('\n'),
        values: {
          messageCount: String(activity.totalMessages),
          contributorCount: String(activity.contributors.size),
        },
        data: { activity },
      };
    } catch (err) {
      logger.error('Activity context provider error:', err);
      return { text: '', values: {}, data: {} };
    }
  },
};
