// Token addresses on Base (chain 8453)
export const TOKENS: Record<string, { address: string; name: string; symbol: string }> = {
  ZABAL: {
    address: '0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07',
    name: 'ZABAL',
    symbol: '$ZABAL',
  },
  SANG: {
    address: '0x4FF4d349CAa028BD069bbE85fA05253f96176741',
    name: 'SANG',
    symbol: '$SANG',
  },
};

// Ecosystem keywords tracked for topic analysis
export const TOPIC_KEYWORDS = [
  'zabal', 'sang', 'songjam', 'wavewarz', 'clanker', 'empire',
  'farcaster', 'base', 'ethereum', 'eth', 'fractal', 'incented',
  'governance', 'music', 'nft', 'token', 'dao', 'zao', 'virtuals',
  'builder', 'hackathon', 'coordination', 'onchain', 'defi',
];

// Farcaster search terms for ecosystem mentions
export const FARCASTER_SEARCH_TERMS = ['zabal', 'sang', 'songjam'] as const;

// Cache TTLs (milliseconds)
export const CACHE_TTL = {
  DEXSCREENER: 60_000,          // 1 minute
  EMPIRE: 120_000,              // 2 minutes
  FARCASTER: 300_000,           // 5 minutes
  FARCASTER_CHANNEL: 300_000,   // 5 minutes
  EMPIRE_LEADERBOARD: 300_000,  // 5 minutes
  EMPIRE_BOOSTERS: 600_000,     // 10 minutes
} as const;

// Activity tracker limits
export const TRACKER_LIMITS = {
  MAX_MESSAGES_PER_CHANNEL: 500,
  MAX_CHANNELS: 50,
  MAX_LINKS_PER_CHANNEL: 100,
  MESSAGE_TTL_HOURS: 24,
} as const;
