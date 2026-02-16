# ZABAL Agent

Coordination intelligence agent for the ZABAL ecosystem, built on [ElizaOS](https://github.com/elizaOS/eliza) v1.7.2. Runs on Discord with Anthropic Claude.

ZABAL tracks contributions, maps relationships, and surfaces signal across platforms. It turns fragmented community activity into structured collective intelligence.

## Architecture

```
src/
  index.ts              # Project entry — exports ProjectAgent
  character.ts          # ZABAL character definition (system prompt, knowledge, style)
  plugin.ts             # Plugin assembly — wires actions, providers, services, events
  constants.ts          # Token addresses, keywords, cache TTLs, tracker limits
  cache.ts              # Generic TTL cache with eviction
  tracker.ts            # In-memory activity tracker with memory caps

  actions/
    token-info.ts       # TOKEN_INFO — live $ZABAL / $SANG price data via DexScreener
    empire-info.ts      # EMPIRE_INFO — treasury, burns, distributions from Empire Builder
    recap.ts            # COMMUNITY_RECAP — activity summary with time windows
    who-active.ts       # WHO_ACTIVE — top contributors in the last 24h

  api/
    dexscreener.ts      # DexScreener API client (free, no auth)
    empire.ts           # Empire Builder API client
    farcaster.ts        # Neynar/Farcaster cast search (optional, needs API key)

  providers/
    token-data.ts       # Injects live token prices into every LLM prompt
    activity-context.ts # Injects 6h activity summary into LLM context
    farcaster-social.ts # Injects recent Farcaster casts (when configured)

  services/
    slash-commands.ts    # Discord slash commands: /price, /recap, /active, /empire, /zabal

  __tests__/            # 123 tests across 18 files
```

## Tokens

| Token | Symbol | Chain | Address |
|-------|--------|-------|---------|
| ZABAL | $ZABAL | Base (8453) | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` |
| SANG  | $SANG  | Base (8453) | `0x4FF4d349CAa028BD069bbE85fA05253f96176741` |

## Actions

| Action | Trigger | Data Source |
|--------|---------|-------------|
| `TOKEN_INFO` | "ZABAL price", "$SANG", "how is SANG trading" | DexScreener API |
| `EMPIRE_INFO` | "empire stats", "treasury", "how much burned" | Empire Builder API |
| `COMMUNITY_RECAP` | "recap", "what did I miss", "catch me up" | In-memory tracker |
| `WHO_ACTIVE` | "who's active", "active contributors", "community pulse" | In-memory tracker |

## Slash Commands

| Command | Description |
|---------|-------------|
| `/price [token]` | Get live price data for ZABAL, SANG, or both |
| `/recap [hours]` | Community activity recap (1h–24h window) |
| `/active` | Top contributors in the last 24h |
| `/empire` | Empire Builder metrics |
| `/zabal` | About ZABAL and ecosystem info |

## Setup

### Prerequisites

- [Bun](https://bun.sh) v1.2+
- [ElizaOS CLI](https://github.com/elizaOS/eliza) v1.7.2
- Discord bot token and application ID
- Anthropic API key

### Environment Variables

Copy `.env.example` and fill in the required values:

```bash
cp .env.example .env
```

**Required:**
```
ANTHROPIC_API_KEY=sk-ant-...
DISCORD_API_TOKEN=MTQ3...
DISCORD_APPLICATION_ID=1472384684800475382
```

**Optional:**
```
FARCASTER_NEYNAR_API_KEY=...     # Enables Farcaster social context
DISCORD_SHOULD_RESPOND_ONLY_TO_MENTIONS=true
```

### Install & Run

```bash
# Install dependencies
bun install

# Build
bun run build

# Start (production)
elizaos start

# Start with hot-reload (development)
elizaos dev
```

## Testing

```bash
# Run all tests (123 tests across 18 files)
bun test

# Run with coverage
bun run test:coverage

# Watch mode
bun run test:watch
```

### Test Coverage

- **Plugin**: metadata, actions, providers, services, events registration
- **Actions**: validation logic, handler output, edge cases
- **Cache**: store/retrieve, TTL expiry, eviction, clear
- **Tracker**: message tracking, channel caps, topic extraction, link detection, memory limits
- **Providers**: context injection, graceful fallbacks
- **Events**: MESSAGE_RECEIVED silent tracking, self-exclusion
- **Error handling**: empty input, null content, malformed events
- **Structure**: file layout, modular plugin assembly, configuration

## Activity Tracker Limits

The in-memory tracker has built-in caps to prevent unbounded growth:

| Limit | Value |
|-------|-------|
| Max messages per channel | 500 |
| Max channels tracked | 50 |
| Max links per channel | 100 |
| Message TTL | 24 hours |

When caps are hit, oldest data is pruned (keeps 80% of messages, evicts oldest channel).

## API Reference

### DexScreener (free, no auth)
```
GET https://api.dexscreener.com/latest/dex/tokens/{address}
```
Returns trading pairs — the agent selects the pair with highest liquidity and formats price, 24h change, market cap, volume, and liquidity.

### Empire Builder
```
GET https://www.empirebuilder.world/api/empires/{address}
```
Returns treasury balance, total burned, total distributed, and distribution history.

### Neynar / Farcaster (optional)
```
GET https://api.neynar.com/v2/farcaster/cast/search?q=zabal&limit=5
Header: x-api-key: {FARCASTER_NEYNAR_API_KEY}
```
Returns recent casts mentioning ZABAL. Requires API key — gracefully skipped when not configured.
