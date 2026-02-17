# ZABAL Agent

Coordination intelligence agent for the ZABAL ecosystem, built on [ElizaOS](https://github.com/elizaOS/eliza) v1.7.2. Runs on Discord with Anthropic Claude, with a web chat UI at localhost:3000.

ZABAL tracks contributions, maps relationships, and surfaces signal across platforms. It turns fragmented community activity into structured collective intelligence — purpose-built for a livestreaming community that spans den.show, X Spaces, YouTube Live, Reake, Farcaster, and Discord.

## What's Live Now

### Discord Bot + Web Chat
- **Token tracking** — Live $ZABAL and $SANG prices via DexScreener
- **Empire Builder** — Treasury, burns, distributions, leaderboard, boosters
- **Farcaster monitoring** — Cast search, channel feeds, ecosystem mentions with deduplication
- **Community recaps** — Multi-source activity summaries (Discord + Farcaster + Empire leaderboard)
- **Active contributors** — Cross-platform contributor pulse (Discord + Farcaster casters)
- **5 slash commands** — `/price`, `/recap`, `/active`, `/empire`, `/zabal`
- **Natural language** — Tag `@ZABAL` with any question about the ecosystem
- **Silent observation** — Tracks all Discord messages for topic analysis, link collection, contributor metrics

### Data Flow
```
Discord activity ──────┐
Farcaster (Neynar) ────┼──→ ZABAL Bot ──→ /recap  (sectioned: Discord + Farcaster + Empire)
Empire Builder API ────┤              ──→ /active (Discord contributors + Farcaster casters)
DexScreener ───────────┘              ──→ /price  (live token data)
                                      ──→ /empire (treasury + leaderboard)
                                      ──→ Web UI  (localhost:3000)
```

---

## Vision: Unified Livestream Community Hub

ZABAL is evolving into the coordination layer for a multi-platform livestreaming community. The core idea: **one community, many platforms, unified signal.**

### Unified Stream Chat

The flagship feature — a shared chat that bridges every platform the community streams to:

```
den.show chat ──────┐
X Spaces chat ──────┤
YouTube Live chat ──┼──→ ZABAL Bot (hub) ──→ Discord #stream-chat
Reake chat ─────────┤                   ──→ Farcaster miniapp
Discord chat ───────┘                   ──→ Web UI
```

**Inbound:** Bot monitors each platform's chat, relays messages into Discord with platform badges:
```
[YT] @alice: love this track
[den] @bob: wagmi
[X] @charlie: fire stream
[discord] @dave: gm
```

**Outbound:** Messages from Discord `#stream-chat` relay back to active stream chats.

### Platform Integration Status

| Platform | Chat Read | Chat Write | Stream Detection | Status |
|----------|-----------|------------|-----------------|--------|
| **YouTube Live** | Full (gRPC streaming + REST) | Full (send, delete, moderate) | YouTube Data API v3 | Ready to build |
| **Discord** | Full (MESSAGE_RECEIVED events) | Full (bot responses) | Voice channel detection | Live |
| **Farcaster** | Cast search + channel feeds | Cast composition via miniapp SDK | Neynar webhooks | Live (read), miniapp planned |
| **X Spaces** | Metadata only (no chat API) | Post tweets about Spaces | Spaces search/lookup API | Discovery only |
| **den.show** | No public API | No public API | Manual / scraping | Needs partnership or reverse engineering |
| **Reake** | Unknown | Unknown | Unknown | Needs research |

### YouTube Live Chat Integration
The most mature integration opportunity. YouTube Data API v3 provides:
- **Read:** `liveChatMessages.list` (REST polling) or `liveChatMessages.streamList` (gRPC real-time)
- **Write:** `liveChatMessages.insert` (text messages + polls)
- **Moderate:** Delete messages, ban/unban users
- **Events:** Super Chats, Super Stickers, memberships, polls
- **Auth:** OAuth 2.0 with `youtube.force-ssl` scope
- **gRPC streaming** dramatically reduces latency vs REST polling

### X Spaces Integration
Limited but useful for discovery:
- `GET /2/spaces/:id` — Space metadata (title, state, participant count)
- `GET /2/spaces/by/creator_ids` — Find Spaces by host
- `GET /2/spaces/search` — Search by keyword
- `GET /2/spaces/:id/tweets` — Posts shared in a Space
- **No chat/audio access** — API is metadata-only
- Bot can announce "ZABAL is live on X Spaces" and track listener counts

### den.show Integration
Web3-native streaming platform on Base:
- Creator fan tokens (ERC20 on Base)
- Splits contracts for revenue distribution
- Clipping capabilities
- **No public API or developer docs** — would require partnership, websocket reverse engineering, or on-chain contract interaction
- On-chain contracts (fan tokens, splits) are interactable directly on Base

### Farcaster Miniapp
Build a native miniapp that lives in Warpcast:
- **SDK:** `@farcaster/miniapp-sdk` with wallet integration (EIP-1193)
- **Auth:** Sign In with Farcaster (SIWF)
- **Actions:** `composeCast`, `swapToken`, `sendToken`, `viewProfile`
- **Notifications:** Server-initiated push (1/30s rate, 100/day per token)
- **Wallet:** Full Ethereum provider for on-chain transactions (tips, token-gating, attestations)
- **Distribution:** Discovered in Warpcast app store, shared as embeds in casts
- **Use case:** Unified stream chat UI, token-gated access, live polls, tipping — all native in Warpcast

---

## Planned Features

### Stream Management
- **`/golive [platform] [url]`** — Announce stream across Discord + Farcaster, set up chat bridge
- **`/schedule [time] [platform] [topic]`** — Schedule streams with countdown reminders
- **Auto-detect live** — Monitor YouTube/X APIs for when community members go live
- **`/endstream`** — Close chat bridge, trigger post-stream recap

### Stream Engagement
- **Watch party tracking** — Track attendance via Discord voice channels + chat participation
- **`/streamstats`** — Stream history: total streams, avg viewers, top attended, platform breakdown
- **Viewer leaderboard** — Most consistent community members across all platforms
- **`/clip [url] [description]`** — Community clip submissions, weekly top clips
- **Live polls** — Create polls during streams (YouTube native + Discord + Farcaster miniapp)
- **Song requests** — `/request [song]` during music streams

### Token Economy & Onchain
- **Stream rewards** — Auto-distribute $ZABAL to stream attendees via Empire Builder
- **Boost multipliers** — Empire leaderboard holders get bonus attendance rewards
- **Token-gated streams** — Verify $ZABAL balance for exclusive content
- **`/tip @user [amount]`** — Send $ZABAL tips for contributions
- **Onchain attestations** — "Attended ZABAL stream #47" via EAS on Base
- **Creator splits** — Automated revenue sharing for collaborative streams (den.show splits integration)

### Content & Knowledge
- **`/vods`** — Searchable index of past streams with links, topics, timestamps
- **Post-stream AI summaries** — Auto-generate recap of what was discussed
- **`/highlight [topic]`** — Search past stream content by keyword
- **Show notes** — Auto-post recap with key links, topics, action items
- **Knowledge graph** — Map relationships between topics, contributors, and streams over time

### Music & Creative (SongJam/SANG)
- **`/playlist`** — Community-curated playlist for streams
- **Beat battles / WaveWarz** — Bracket competitions with community voting
- **`/drops`** — Track NFT/music drops from community creators
- **Collaborative sessions** — Track jam sessions, credit contributors

### Governance & Coordination
- **`/propose [topic]`** — Submit community proposals (stream topics, collabs, treasury)
- **`/vote`** — Polls with optional token-weighted voting
- **`/bounty [task] [reward]`** — Post bounties for community tasks (clip editing, graphics, dev)
- **Contributor scoring** — Weighted: stream attendance + Discord activity + Farcaster engagement + onchain activity + Empire leaderboard rank

### Analytics Dashboard (Web UI)
- **Community health** — Members, growth, retention, engagement trends
- **Stream analytics** — Views over time, peak concurrent, topic heatmap, platform breakdown
- **Token metrics** — Price charts, holders, Empire leaderboard, distribution history
- **Contributor profiles** — Per-member activity across all platforms
- **Cross-platform signal** — What's trending across Discord + Farcaster + streams

### Farcaster Miniapp Features
- **Unified chat** — See all stream chats in one place inside Warpcast
- **One-tap tip** — Tip streamers with $ZABAL directly from wallet
- **Stream notifications** — Push when community goes live
- **Live polls** — Vote on stream topics, song requests, decisions
- **Leaderboard** — View Empire leaderboard and contributor scores
- **Token-gate check** — Verify balance for exclusive stream access

---

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
    recap.ts            # COMMUNITY_RECAP — multi-source activity summary
    who-active.ts       # WHO_ACTIVE — cross-platform contributor pulse

  api/
    dexscreener.ts      # DexScreener API client (free, no auth)
    empire.ts           # Empire Builder API — empire data, leaderboard, boosters
    farcaster.ts        # Neynar/Farcaster — cast search, channel feeds, recap aggregator

  formatters/
    recap-formatter.ts  # Shared recap formatting (Discord + Farcaster + Empire sections)
    active-formatter.ts # Shared active formatting (Discord + Farcaster contributors)

  providers/
    token-data.ts       # Injects live token prices into every LLM prompt
    activity-context.ts # Injects 6h activity summary into LLM context
    farcaster-social.ts # Injects recent Farcaster casts into LLM context

  services/
    slash-commands.ts    # Discord slash commands: /price, /recap, /active, /empire, /zabal

  __tests__/            # 136 tests across 19 files
```

## Tokens

| Token | Symbol | Chain | Address |
|-------|--------|-------|---------|
| ZABAL | $ZABAL | Base (8453) | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` |
| SANG  | $SANG  | Base (8453) | `0x4FF4d349CAa028BD069bbE85fA05253f96176741` |

## Actions

| Action | Trigger | Data Sources |
|--------|---------|-------------|
| `TOKEN_INFO` | "ZABAL price", "$SANG", "how is SANG trading" | DexScreener |
| `EMPIRE_INFO` | "empire stats", "treasury", "how much burned" | Empire Builder |
| `COMMUNITY_RECAP` | "recap", "what did I miss", "catch me up" | Discord tracker + Farcaster + Empire leaderboard |
| `WHO_ACTIVE` | "who's active", "active contributors", "community pulse" | Discord tracker + Farcaster |

## Slash Commands

| Command | Description |
|---------|-------------|
| `/price [token]` | Live price data for ZABAL, SANG, or both |
| `/recap [hours]` | Multi-source community recap (1h–24h) |
| `/active` | Cross-platform contributor pulse |
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
DISCORD_APPLICATION_ID=...
```

**Recommended:**
```
FARCASTER_NEYNAR_API_KEY=...         # Farcaster monitoring (get at neynar.com)
EMPIRE_BUILDER_API_KEY=...           # Empire leaderboard + boosters
DISCORD_SHOULD_RESPOND_ONLY_TO_MENTIONS=true
```

### Install & Run

```bash
bun install
bun run build
elizaos start        # production
elizaos dev          # development with hot-reload
```

Web chat available at `http://localhost:3000` when running.

## Testing

```bash
bun test             # 136 tests across 19 files
bun run test:coverage
bun run test:watch
```

### Test Coverage
- **Plugin**: metadata, actions, providers, services, events registration
- **Actions**: validation logic, handler output, multi-source data
- **Formatters**: recap + active formatting with all data combinations
- **Cache**: store/retrieve, TTL expiry, eviction, clear
- **Tracker**: message tracking, channel caps, topic extraction, link detection, memory limits
- **Providers**: context injection, graceful fallbacks
- **Events**: MESSAGE_RECEIVED silent tracking, self-exclusion
- **Error handling**: empty input, null content, malformed events

## API Reference

### DexScreener (free, no auth)
```
GET https://api.dexscreener.com/latest/dex/tokens/{address}
```

### Empire Builder
```
GET https://www.empirebuilder.world/api/empires/{address}        # Empire data
GET https://www.empirebuilder.world/api/leaderboard/{address}    # Leaderboard (holders, ranks, boosts)
GET https://www.empirebuilder.world/api/boosters/{address}       # Configured boosters
Header: x-api-key: {EMPIRE_BUILDER_API_KEY}
```

### Neynar / Farcaster
```
GET https://api.neynar.com/v2/farcaster/cast/search?q=zabal+OR+sang+OR+songjam&sort_type=algorithmic&limit=25
GET https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=zabal&limit=15
Header: x-api-key: {FARCASTER_NEYNAR_API_KEY}
```

### YouTube Live Chat (planned)
```
GET  https://www.googleapis.com/youtube/v3/liveChat/messages     # Read chat (REST polling)
POST https://www.googleapis.com/youtube/v3/liveChat/messages     # Send message / create poll
gRPC youtube.googleapis.com:443 V3DataLiveChatMessageService.StreamList  # Real-time streaming
Auth: OAuth 2.0 (youtube.force-ssl scope)
```

### X Spaces (planned — metadata only)
```
GET https://api.x.com/2/spaces/:id                    # Space lookup
GET https://api.x.com/2/spaces/by/creator_ids          # Spaces by host
GET https://api.x.com/2/spaces/search                  # Search Spaces
Auth: OAuth 2.0
```

### Farcaster Miniapp SDK (planned)
```
npm install @farcaster/miniapp-sdk
sdk.actions.ready()          # Initialize
sdk.actions.signin()         # Sign In with Farcaster
sdk.actions.composeCast()    # Create a cast
sdk.actions.swapToken()      # Token swap
sdk.actions.sendToken()      # Token send
sdk.wallet.getEthereumProvider()  # EIP-1193 wallet
```

## Activity Tracker Limits

| Limit | Value |
|-------|-------|
| Max messages per channel | 500 |
| Max channels tracked | 50 |
| Max links per channel | 100 |
| Message TTL | 24 hours |

## Cache TTLs

| Data Source | TTL |
|-------------|-----|
| DexScreener | 1 minute |
| Empire Builder | 2 minutes |
| Empire Leaderboard | 5 minutes |
| Empire Boosters | 10 minutes |
| Farcaster Search | 5 minutes |
| Farcaster Channel Feed | 5 minutes |

## Ecosystem

- **$ZABAL** — Coordination intelligence token on Base, launched via Clanker v4 / Empire Builder
- **$SANG** — SongJam AI agent token on Virtuals Protocol
- **zabal.art** — Creative hub and ecosystem portal
- **den.show** — Web3 livestreaming with creator tokens on Base
- **Empire Builder** — 80% of trading fees to creator, leaderboard with boost multipliers
- **Farcaster** — Decentralized social protocol, miniapps ecosystem
