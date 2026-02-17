import type { Plugin } from '@elizaos/core';
import { logger } from '@elizaos/core';

// Actions
import { tokenInfoAction } from './actions/token-info.ts';
import { empireInfoAction } from './actions/empire-info.ts';
import { recapAction } from './actions/recap.ts';
import { whoActiveAction } from './actions/who-active.ts';

// Providers
import { tokenDataProvider } from './providers/token-data.ts';
import { activityContextProvider } from './providers/activity-context.ts';
import { farcasterSocialProvider } from './providers/farcaster-social.ts';

// Services
import { SlashCommandService } from './services/slash-commands.ts';

// Tracker (for MESSAGE_RECEIVED event)
import { trackMessage } from './tracker.ts';

const plugin: Plugin = {
  name: 'zabal',
  description: 'ZABAL ecosystem plugin — token data, empire metrics, activity tracking, and community recaps',
  priority: 0,
  config: {},

  async init(_config: Record<string, string>) {
    logger.info('*** Initializing ZABAL plugin ***');
    logger.info('Token tracking: $ZABAL and $SANG on Base');
    logger.info('Activity tracker: enabled (silent observation)');
    logger.info('Community recap: enabled (@ZABAL recap)');
    if (process.env.FARCASTER_NEYNAR_API_KEY) {
      logger.info('Farcaster social context: enabled');
    } else {
      logger.info('Farcaster social context: disabled (no NEYNAR API key)');
    }
    if (process.env.EMPIRE_BUILDER_API_KEY) {
      logger.info('Empire Builder API: authenticated');
    } else {
      logger.info('Empire Builder API: unauthenticated (no API key)');
    }
  },

  actions: [tokenInfoAction, empireInfoAction, recapAction, whoActiveAction],
  providers: [tokenDataProvider, activityContextProvider, farcasterSocialProvider],
  services: [SlashCommandService],

  events: {
    MESSAGE_RECEIVED: [
      async (params: Record<string, any>) => {
        // Silent activity tracking — observe every message without responding
        try {
          const message = params.message || params;
          const content = message?.content || message;
          const text = typeof content === 'string' ? content : content?.text ?? '';
          const author = message?.userName || message?.author || params?.userName || 'unknown';
          const channelId = message?.channelId || message?.roomId || params?.channelId || 'general';

          if (text && author !== 'ZABAL') {
            trackMessage(author, text, channelId);
          }
        } catch (_) {
          // Silent fail — don't break the bot over tracking
        }
      },
    ],
  },
};

export default plugin;
