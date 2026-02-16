import { TOPIC_KEYWORDS, TRACKER_LIMITS } from './constants.ts';

export interface TrackedMessage {
  author: string;
  text: string;
  channel: string;
  timestamp: number;
}

export interface ChannelActivity {
  messages: TrackedMessage[];
  contributors: Map<string, number>;
  links: string[];
  topics: Map<string, number>;
}

export interface ActivitySnapshot {
  totalMessages: number;
  contributors: Map<string, number>;
  topTopics: [string, number][];
  links: string[];
  channelBreakdown: Map<string, number>;
  recentMessages: TrackedMessage[];
}

const activityStore: Map<string, ChannelActivity> = new Map();

function getOrCreateChannel(channelId: string): ChannelActivity {
  let activity = activityStore.get(channelId);
  if (!activity) {
    // Enforce channel limit — evict oldest if at cap
    if (activityStore.size >= TRACKER_LIMITS.MAX_CHANNELS) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [key, val] of activityStore) {
        const latest = val.messages[val.messages.length - 1]?.timestamp ?? 0;
        if (latest < oldestTime) {
          oldestTime = latest;
          oldestKey = key;
        }
      }
      if (oldestKey) activityStore.delete(oldestKey);
    }

    activity = {
      messages: [],
      contributors: new Map(),
      links: [],
      topics: new Map(),
    };
    activityStore.set(channelId, activity);
  }
  return activity;
}

export function trackMessage(author: string, text: string, channelId: string): void {
  const activity = getOrCreateChannel(channelId);
  const now = Date.now();
  const cutoff = now - TRACKER_LIMITS.MESSAGE_TTL_HOURS * 60 * 60 * 1000;

  // Prune messages older than TTL
  activity.messages = activity.messages.filter((m) => m.timestamp > cutoff);

  // Enforce per-channel message cap
  if (activity.messages.length >= TRACKER_LIMITS.MAX_MESSAGES_PER_CHANNEL) {
    activity.messages = activity.messages.slice(-Math.floor(TRACKER_LIMITS.MAX_MESSAGES_PER_CHANNEL * 0.8));
  }

  activity.messages.push({ author, text, channel: channelId, timestamp: now });

  // Track contributor
  activity.contributors.set(author, (activity.contributors.get(author) ?? 0) + 1);

  // Extract links (capped)
  const urlRegex = /https?:\/\/[^\s<>]+/g;
  const urls = text.match(urlRegex);
  if (urls && activity.links.length < TRACKER_LIMITS.MAX_LINKS_PER_CHANNEL) {
    for (const url of urls) {
      if (activity.links.length >= TRACKER_LIMITS.MAX_LINKS_PER_CHANNEL) break;
      activity.links.push(url);
    }
  }

  // Track topic keywords
  const lower = text.toLowerCase();
  for (const keyword of TOPIC_KEYWORDS) {
    if (lower.includes(keyword)) {
      activity.topics.set(keyword, (activity.topics.get(keyword) ?? 0) + 1);
    }
  }
}

export function getActivitySince(hoursAgo: number): ActivitySnapshot {
  const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;
  const allContributors = new Map<string, number>();
  const allTopics = new Map<string, number>();
  const allLinks: string[] = [];
  const channelBreakdown = new Map<string, number>();
  const recentMessages: TrackedMessage[] = [];
  let totalMessages = 0;

  for (const [channelId, activity] of activityStore) {
    const recent = activity.messages.filter((m) => m.timestamp > cutoff);
    totalMessages += recent.length;
    channelBreakdown.set(channelId, recent.length);

    for (const msg of recent) {
      allContributors.set(msg.author, (allContributors.get(msg.author) ?? 0) + 1);
      recentMessages.push(msg);
    }

    for (const [topic, count] of activity.topics) {
      allTopics.set(topic, (allTopics.get(topic) ?? 0) + count);
    }

    for (const link of activity.links) {
      allLinks.push(link);
    }
  }

  const topTopics = [...allTopics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return { totalMessages, contributors: allContributors, topTopics, links: allLinks, channelBreakdown, recentMessages };
}

/** Clear all tracked activity. Useful for testing. */
export function clearActivity(): void {
  activityStore.clear();
}

/** Get current store size for monitoring. */
export function getStoreStats(): { channels: number; totalMessages: number } {
  let totalMessages = 0;
  for (const activity of activityStore.values()) {
    totalMessages += activity.messages.length;
  }
  return { channels: activityStore.size, totalMessages };
}
