import type { ActivitySnapshot } from '../tracker.ts';
import type { FarcasterRecapData } from '../api/farcaster.ts';

export interface ActiveSources {
  discord: ActivitySnapshot;
  farcaster: FarcasterRecapData | null;
}

export function formatActive(sources: ActiveSources): string {
  const { discord, farcaster } = sources;

  const hasDiscord = discord.contributors.size > 0;
  const hasFarcaster = farcaster && farcaster.uniqueCasters.size > 0;

  if (!hasDiscord && !hasFarcaster) {
    return 'No activity tracked yet. I silently observe messages in the background — give it some time and I\'ll have contributor data for you.';
  }

  const lines: string[] = [];
  lines.push('**Community Pulse — Last 24h**');
  lines.push('');

  // --- Discord Contributors ---
  if (hasDiscord) {
    const sorted = [...discord.contributors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    lines.push(`**Discord** — ${discord.contributors.size} contributors, ${discord.totalMessages} messages`);
    for (let i = 0; i < sorted.length; i++) {
      const [name, count] = sorted[i];
      lines.push(`${i + 1}. **${name}** — ${count} message${count > 1 ? 's' : ''}`);
    }
    if (discord.contributors.size > 15) {
      lines.push(`  ...and ${discord.contributors.size - 15} more`);
    }
    lines.push('');
  }

  // --- Farcaster Casters ---
  if (hasFarcaster) {
    const sortedCasters = [...farcaster.uniqueCasters.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    lines.push(`**Farcaster** — ${farcaster.uniqueCasters.size} casters, ${farcaster.totalMentions} casts`);
    for (let i = 0; i < sortedCasters.length; i++) {
      const [username, count] = sortedCasters[i];
      lines.push(`${i + 1}. **@${username}** — ${count} cast${count > 1 ? 's' : ''}`);
    }
    if (farcaster.uniqueCasters.size > 10) {
      lines.push(`  ...and ${farcaster.uniqueCasters.size - 10} more`);
    }
    lines.push('');
  }

  if (!hasDiscord) {
    lines.push('*Discord tracking builds over time — the longer I run, the richer the Discord data.*');
  }

  return lines.join('\n').trimEnd();
}
