import type { Action, Content, HandlerCallback, IAgentRuntime, Memory, State } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { fetchEmpireData, formatEmpireResponse } from '../api/empire.ts';

export const empireInfoAction: Action = {
  name: 'EMPIRE_INFO',
  similes: ['EMPIRE_STATS', 'EMPIRE_METRICS', 'EMPIRE_BUILDER', 'TREASURY_INFO'],
  description:
    'Fetches Empire Builder metrics for ZABAL — treasury balance, burns, and distributions',

  validate: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State
  ): Promise<boolean> => {
    const text = (message.content?.text ?? '').toLowerCase();
    const empireKeywords = ['empire', 'treasury', 'burn', 'distribution', 'builder metrics', 'empire builder'];
    return empireKeywords.some((k) => text.includes(k));
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
      const data = await fetchEmpireData();

      let text: string;
      if (data) {
        text = formatEmpireResponse(data);
      } else {
        text =
          'Could not fetch Empire Builder data right now. The API may be temporarily unavailable. ZABAL was launched via Empire Builder on Clanker v4 — 80% of trading fees go to the creator.';
      }

      const responseContent: Content = {
        text,
        actions: ['EMPIRE_INFO'],
        source: message.content.source,
      };

      await callback(responseContent);
    } catch (error) {
      logger.error('Error in EMPIRE_INFO action:', error);
      throw error;
    }
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: 'Show me the empire stats for ZABAL' } },
      {
        name: '{{name2}}',
        content: {
          text: '**ZABAL Empire Builder Metrics**\nTreasury: $12.34K\nTotal Burned: $5.67K\nTotal Distributed: $8.90K',
          actions: ['EMPIRE_INFO'],
        },
      },
    ],
  ],
};
