import type { ActivitySnapshot } from '../tracker.ts';
import type { FarcasterRecapData } from '../api/farcaster.ts';
import type { LeaderboardEntry } from '../api/empire.ts';
import { formatLeaderboardResponse } from '../api/empire.ts';

export interface RecapSources {
  discord: ActivitySnapshot;
  farcaster: FarcasterRecapData | null;
  leaderboard: LeaderboardEntry[];
}

export function formatRecap(hours: number, sources: RecapSources): string {
  const { discord, farcaster, leaderboard } = sources;

  const hasDiscord = discord.totalMessages > 0;
  const hasFarcaster = farcaster && farcaster.totalMentions > 0;
  const hasLeaderboard = leaderboard.length > 0;

  if (!hasDiscord && !hasFarcaster && !hasLeaderboard) {
    return `No activity tracked in the last ${hours} hour${hours > 1 ? 's' : ''}. I silently observe messages in the background — the longer I run, the richer the recaps get.`;
  }

  const lines: string[] = [];
  lines.push(`**Community Recap — Last ${hours}h**`);
  lines.push('');

  // --- Discord Activity ---
  if (hasDiscord) {
    lines.push(`**Discord Activity** — ${discord.totalMessages} messages`);

    const sortedContributors = [...discord.contributors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    if (sortedContributors.length > 0) {
      lines.push('Top contributors:');
      for (const [name, count] of sortedContributors) {
        lines.push(`  - ${name}: ${count} message${count > 1 ? 's' : ''}`);
      }
    }

    if (discord.topTopics.length > 0) {
      lines.push('Trending topics:');
      for (const [topic, count] of discord.topTopics) {
        lines.push(`  - ${topic}: ${count} mention${count > 1 ? 's' : ''}`);
      }
    }

    const uniqueLinks = [...new Set(discord.links)].slice(0, 5);
    if (uniqueLinks.length > 0) {
      lines.push('Links shared:');
      for (const link of uniqueLinks) {
        lines.push(`  - ${link}`);
      }
    }

    const sortedChannels = [...discord.channelBreakdown.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    if (sortedChannels.length > 1) {
      lines.push('Channel activity:');
      for (const [channelId, count] of sortedChannels) {
        lines.push(`  - <#${channelId}>: ${count} messages`);
      }
    }

    lines.push('');
  }

  // --- Farcaster Mentions ---
  if (hasFarcaster) {
    lines.push(`**Farcaster Mentions** — ${farcaster.totalMentions} casts found`);

    const sortedCasters = [...farcaster.uniqueCasters.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    if (sortedCasters.length > 0) {
      lines.push('Active casters:');
      for (const [username, count] of sortedCasters) {
        lines.push(`  - @${username}: ${count} cast${count > 1 ? 's' : ''}`);
      }
    }

    if (farcaster.topCast) {
      const tc = farcaster.topCast;
      const likes = tc.reactions?.likes_count ?? 0;
      const recasts = tc.reactions?.recasts_count ?? 0;
      const preview = tc.text.length > 120 ? tc.text.slice(0, 120) + '...' : tc.text;
      lines.push(`Top cast by @${tc.author?.username ?? 'unknown'} (${likes} likes, ${recasts} recasts):`);
      lines.push(`  "${preview}"`);
    }

    lines.push('');
  }

  // --- Empire Leaderboard ---
  if (hasLeaderboard) {
    lines.push(formatLeaderboardResponse(leaderboard));
    lines.push('');
  }

  // Footer
  if (!hasDiscord) {
    lines.push('*Discord tracking builds over time — the longer I run, the richer the Discord data.*');
  }

  return lines.join('\n').trimEnd();
}
