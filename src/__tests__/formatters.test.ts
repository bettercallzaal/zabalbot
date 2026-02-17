import { describe, expect, it } from 'bun:test';
import { formatRecap } from '../formatters/recap-formatter';
import { formatActive } from '../formatters/active-formatter';
import type { ActivitySnapshot } from '../tracker';
import type { FarcasterRecapData } from '../api/farcaster';
import type { LeaderboardEntry } from '../api/empire';

function emptyDiscord(): ActivitySnapshot {
  return {
    totalMessages: 0,
    contributors: new Map(),
    topTopics: [],
    links: [],
    channelBreakdown: new Map(),
    recentMessages: [],
  };
}

function sampleDiscord(): ActivitySnapshot {
  return {
    totalMessages: 42,
    contributors: new Map([['alice', 20], ['bob', 12], ['charlie', 10]]),
    topTopics: [['zabal', 15], ['music', 8]],
    links: ['https://zabal.art', 'https://example.com'],
    channelBreakdown: new Map([['general', 30], ['dev', 12]]),
    recentMessages: [],
  };
}

function sampleFarcaster(): FarcasterRecapData {
  return {
    mentionCasts: [
      { hash: 'abc', author: { username: 'farcaster_alice', display_name: 'Alice' }, text: 'Love the zabal vibes', timestamp: '2025-01-01T00:00:00Z', reactions: { likes_count: 10, recasts_count: 3 } },
      { hash: 'def', author: { username: 'farcaster_bob', display_name: 'Bob' }, text: 'Building with zabal', timestamp: '2025-01-01T01:00:00Z', reactions: { likes_count: 5, recasts_count: 1 } },
    ],
    channelCasts: [],
    totalMentions: 2,
    uniqueCasters: new Map([['farcaster_alice', 1], ['farcaster_bob', 1]]),
    topCast: { hash: 'abc', author: { username: 'farcaster_alice', display_name: 'Alice' }, text: 'Love the zabal vibes', timestamp: '2025-01-01T00:00:00Z', reactions: { likes_count: 10, recasts_count: 3 } },
  };
}

function sampleLeaderboard(): LeaderboardEntry[] {
  return [
    { address: '0x1234567890abcdef1234567890abcdef12345678', balance: '500000000000000000000000', baseBalance: '500000000000000000000000', appliedBoosts: [], finalMultiplier: 1, isLP: false, farcasterUsername: 'whale1', rank: 1 },
    { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', balance: '300000000000000000000000', baseBalance: '300000000000000000000000', appliedBoosts: [], finalMultiplier: 2.5, isLP: false, farcasterUsername: null, rank: 2 },
  ];
}

// --- formatRecap ---

describe('formatRecap', () => {
  it('returns empty state message when all sources are empty', () => {
    const result = formatRecap(24, {
      discord: emptyDiscord(),
      farcaster: null,
      leaderboard: [],
    });
    expect(result).toContain('No activity tracked');
    expect(result).toContain('24 hours');
  });

  it('shows Discord-only data when Farcaster is null', () => {
    const result = formatRecap(24, {
      discord: sampleDiscord(),
      farcaster: null,
      leaderboard: [],
    });
    expect(result).toContain('Community Recap');
    expect(result).toContain('Discord Activity');
    expect(result).toContain('42 messages');
    expect(result).toContain('alice');
    expect(result).toContain('zabal');
    expect(result).not.toContain('Farcaster');
    expect(result).not.toContain('Leaderboard');
  });

  it('shows Farcaster-only data when Discord is empty', () => {
    const result = formatRecap(24, {
      discord: emptyDiscord(),
      farcaster: sampleFarcaster(),
      leaderboard: [],
    });
    expect(result).toContain('Community Recap');
    expect(result).toContain('Farcaster Mentions');
    expect(result).toContain('2 casts found');
    expect(result).toContain('@farcaster_alice');
    expect(result).not.toContain('Discord Activity');
    expect(result).toContain('Discord tracking builds over time');
  });

  it('shows all sections when all sources have data', () => {
    const result = formatRecap(24, {
      discord: sampleDiscord(),
      farcaster: sampleFarcaster(),
      leaderboard: sampleLeaderboard(),
    });
    expect(result).toContain('Discord Activity');
    expect(result).toContain('Farcaster Mentions');
    expect(result).toContain('Empire Leaderboard');
    expect(result).toContain('whale1');
    expect(result).not.toContain('Discord tracking builds over time');
  });

  it('shows leaderboard-only data', () => {
    const result = formatRecap(12, {
      discord: emptyDiscord(),
      farcaster: null,
      leaderboard: sampleLeaderboard(),
    });
    expect(result).toContain('Community Recap');
    expect(result).toContain('Empire Leaderboard');
    expect(result).toContain('whale1');
    expect(result).toContain('12h');
  });

  it('shows top cast with preview', () => {
    const result = formatRecap(24, {
      discord: emptyDiscord(),
      farcaster: sampleFarcaster(),
      leaderboard: [],
    });
    expect(result).toContain('Top cast by @farcaster_alice');
    expect(result).toContain('10 likes');
    expect(result).toContain('3 recasts');
    expect(result).toContain('Love the zabal vibes');
  });

  it('abbreviates long addresses in leaderboard', () => {
    const result = formatRecap(24, {
      discord: emptyDiscord(),
      farcaster: null,
      leaderboard: [{ address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', balance: '100000000000000000000', baseBalance: '100000000000000000000', appliedBoosts: [], finalMultiplier: 1, isLP: false, farcasterUsername: null, rank: 1 }],
    });
    expect(result).toContain('0xabcd...abcd');
  });

  it('uses singular hour in message', () => {
    const result = formatRecap(1, {
      discord: emptyDiscord(),
      farcaster: null,
      leaderboard: [],
    });
    expect(result).toContain('1 hour');
    expect(result).not.toContain('1 hours');
  });
});

// --- formatActive ---

describe('formatActive', () => {
  it('returns empty state message when both sources are empty', () => {
    const result = formatActive({
      discord: emptyDiscord(),
      farcaster: null,
    });
    expect(result).toContain('No activity tracked');
  });

  it('shows Discord-only contributors', () => {
    const result = formatActive({
      discord: sampleDiscord(),
      farcaster: null,
    });
    expect(result).toContain('Community Pulse');
    expect(result).toContain('Discord');
    expect(result).toContain('3 contributors');
    expect(result).toContain('alice');
    expect(result).toContain('bob');
    expect(result).not.toContain('Farcaster');
  });

  it('shows Farcaster-only casters', () => {
    const result = formatActive({
      discord: emptyDiscord(),
      farcaster: sampleFarcaster(),
    });
    expect(result).toContain('Community Pulse');
    expect(result).toContain('Farcaster');
    expect(result).toContain('2 casters');
    expect(result).toContain('@farcaster_alice');
    expect(result).toContain('@farcaster_bob');
    expect(result).not.toContain('**Discord**');
    expect(result).toContain('Discord tracking builds over time');
  });

  it('shows both Discord and Farcaster when both have data', () => {
    const result = formatActive({
      discord: sampleDiscord(),
      farcaster: sampleFarcaster(),
    });
    expect(result).toContain('Discord');
    expect(result).toContain('Farcaster');
    expect(result).toContain('alice');
    expect(result).toContain('@farcaster_alice');
    expect(result).not.toContain('Discord tracking builds over time');
  });

  it('shows empty Farcaster as no farcaster section', () => {
    const emptyFarcaster: FarcasterRecapData = {
      mentionCasts: [],
      channelCasts: [],
      totalMentions: 0,
      uniqueCasters: new Map(),
      topCast: null,
    };
    const result = formatActive({
      discord: sampleDiscord(),
      farcaster: emptyFarcaster,
    });
    expect(result).toContain('Discord');
    expect(result).not.toContain('Farcaster');
  });
});
