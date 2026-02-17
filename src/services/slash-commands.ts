import type { IAgentRuntime } from '@elizaos/core';
import { Service, logger } from '@elizaos/core';
import { TOKENS } from '../constants.ts';
import { fetchTokenData, formatTokenResponse } from '../api/dexscreener.ts';
import { fetchEmpireData, formatEmpireResponse, fetchEmpireLeaderboard } from '../api/empire.ts';
import { fetchFarcasterRecapData } from '../api/farcaster.ts';
import { getActivitySince } from '../tracker.ts';
import { formatRecap } from '../formatters/recap-formatter.ts';
import { formatActive } from '../formatters/active-formatter.ts';

const SLASH_COMMANDS = [
  {
    name: 'price',
    description: 'Get live token price data for ZABAL or SANG',
    options: [
      {
        name: 'token',
        description: 'Which token to check',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'ZABAL', value: 'zabal' },
          { name: 'SANG', value: 'sang' },
          { name: 'Both', value: 'both' },
        ],
      },
    ],
  },
  {
    name: 'recap',
    description: 'Get a community activity recap',
    options: [
      {
        name: 'hours',
        description: 'How far back to look',
        type: 4, // INTEGER
        required: false,
        choices: [
          { name: 'Last hour', value: 1 },
          { name: 'Last 4 hours', value: 4 },
          { name: 'Last 6 hours', value: 6 },
          { name: 'Last 12 hours', value: 12 },
          { name: 'Last 24 hours', value: 24 },
        ],
      },
    ],
  },
  {
    name: 'active',
    description: "See who's been active in the community",
  },
  {
    name: 'empire',
    description: 'Get ZABAL Empire Builder metrics — treasury, burns, distributions',
  },
  {
    name: 'zabal',
    description: 'Learn about ZABAL and see available commands',
  },
];

async function registerSlashCommands(): Promise<void> {
  const appId = process.env.DISCORD_APPLICATION_ID;
  const token = process.env.DISCORD_API_TOKEN;

  if (!appId || !token) {
    logger.warn('[SLASH] Missing DISCORD_APPLICATION_ID or DISCORD_API_TOKEN — skipping command registration');
    return;
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(SLASH_COMMANDS),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error(`[SLASH] Failed to register commands: ${res.status} ${body}`);
      return;
    }

    const registered = (await res.json()) as Array<{ name: string }>;
    logger.info(`[SLASH] Registered ${registered.length} slash commands: ${registered.map((c) => '/' + c.name).join(', ')}`);
  } catch (err) {
    logger.error('[SLASH] Error registering commands:', err);
  }
}

async function handleSlashCommand(interaction: any): Promise<void> {
  const commandName = interaction.commandName;
  const OUR_COMMANDS = new Set(['price', 'recap', 'active', 'empire', 'zabal']);

  if (!OUR_COMMANDS.has(commandName)) return;

  try {
    await interaction.deferReply();

    let responseText = '';

    switch (commandName) {
      case 'price': {
        const tokenChoice = interaction.options?.getString('token') ?? 'both';
        const tokensToFetch = tokenChoice === 'both' ? ['ZABAL', 'SANG'] : [tokenChoice.toUpperCase()];
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
        responseText = results.join('\n\n');
        break;
      }

      case 'recap': {
        const hours = interaction.options?.getInteger('hours') ?? 24;

        const [discord, farcaster, leaderboard] = await Promise.all([
          Promise.resolve(getActivitySince(hours)),
          fetchFarcasterRecapData(),
          fetchEmpireLeaderboard(5),
        ]);

        responseText = formatRecap(hours, { discord, farcaster, leaderboard });
        break;
      }

      case 'active': {
        const [discord, farcaster] = await Promise.all([
          Promise.resolve(getActivitySince(24)),
          fetchFarcasterRecapData(),
        ]);

        responseText = formatActive({ discord, farcaster });
        break;
      }

      case 'empire': {
        const data = await fetchEmpireData();
        if (data) {
          responseText = formatEmpireResponse(data);
        } else {
          responseText = 'Could not fetch Empire Builder data right now. The API may be temporarily unavailable. ZABAL was launched via Empire Builder on Clanker v4 — 80% of trading fees go to the creator.';
        }
        break;
      }

      case 'zabal': {
        responseText = [
          '**ZABAL — Coordination Intelligence Layer**',
          '',
          'I am the signal amplifier, pattern recognizer, and relationship mapper for the ZABAL ecosystem.',
          '',
          '**Available Commands:**',
          '`/price [token]` — Live price data for $ZABAL or $SANG',
          '`/recap [hours]` — Community activity recap',
          '`/active` — Who\'s been active recently',
          '`/empire` — Empire Builder metrics (treasury, burns, distributions)',
          '`/zabal` — This help message',
          '',
          'You can also tag me with natural language:',
          '`@ZABAL what\'s the ZABAL price?`',
          '`@ZABAL what did I miss today?`',
          '`@ZABAL who\'s been active?`',
          '',
          '**Ecosystem:**',
          '$ZABAL on Base — launched via Clanker v4 / Empire Builder',
          '$SANG on Base — SongJam AI agent on Virtuals Protocol',
          'zabal.art — Creative hub & ecosystem portal',
        ].join('\n');
        break;
      }
    }

    await interaction.editReply({ content: responseText || 'No data available.' });
  } catch (err) {
    logger.error(`[SLASH] Error handling /${commandName}:`, err);
    try {
      await interaction.editReply({ content: 'Something went wrong processing that command. Try again or tag me directly.' });
    } catch (_) {
      // Already failed, nothing to do
    }
  }
}

export class SlashCommandService extends Service {
  static serviceType = 'zabal-commands';
  capabilityDescription = 'Registers and handles Discord slash commands for the ZABAL bot';
  private handlerAttached = false;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<SlashCommandService> {
    const service = new SlashCommandService(runtime);
    await registerSlashCommands();
    service.tryAttachHandler();
    return service;
  }

  static async stop(_runtime: IAgentRuntime): Promise<void> {
    logger.info('[SLASH] Stopping slash command service');
  }

  async stop(): Promise<void> {
    logger.info('[SLASH] Slash command service stopped');
  }

  private tryAttachHandler(): void {
    if (this.handlerAttached) return;

    try {
      const discordService = this.runtime.getService('discord') as any;
      if (discordService?.client) {
        discordService.client.on('interactionCreate', async (interaction: any) => {
          if (!interaction.isCommand()) return;
          await handleSlashCommand(interaction);
        });
        this.handlerAttached = true;
        logger.info('[SLASH] Interaction handler attached to Discord client');
        return;
      }
    } catch (_) {
      // Discord not ready yet
    }

    logger.info('[SLASH] Discord client not ready, retrying in 5s...');
    setTimeout(() => this.tryAttachHandler(), 5000);
  }
}
