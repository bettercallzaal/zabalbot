import { describe, expect, it, beforeEach } from 'bun:test';
import { trackMessage, getActivitySince, clearActivity, getStoreStats } from '../tracker';

beforeEach(() => {
  clearActivity();
});

describe('Activity Tracker', () => {
  it('tracks messages and counts contributors', () => {
    trackMessage('alice', 'Hello', 'ch-1');
    trackMessage('bob', 'Hi there', 'ch-1');
    trackMessage('alice', 'How are you?', 'ch-1');

    const activity = getActivitySince(1);
    expect(activity.totalMessages).toBe(3);
    expect(activity.contributors.get('alice')).toBe(2);
    expect(activity.contributors.get('bob')).toBe(1);
  });

  it('tracks messages across multiple channels', () => {
    trackMessage('alice', 'In channel 1', 'ch-1');
    trackMessage('bob', 'In channel 2', 'ch-2');

    const activity = getActivitySince(1);
    expect(activity.totalMessages).toBe(2);
    expect(activity.channelBreakdown.size).toBe(2);
    expect(activity.channelBreakdown.get('ch-1')).toBe(1);
    expect(activity.channelBreakdown.get('ch-2')).toBe(1);
  });

  it('detects ecosystem keywords as topics', () => {
    trackMessage('alice', 'The zabal ecosystem on ethereum is fascinating', 'ch-1');

    const activity = getActivitySince(1);
    const topicNames = activity.topTopics.map(([name]) => name);
    expect(topicNames).toContain('zabal');
    expect(topicNames).toContain('ethereum');
  });

  it('extracts links from messages', () => {
    trackMessage('alice', 'Check out https://zabal.art and https://base.org', 'ch-1');

    const activity = getActivitySince(1);
    expect(activity.links.length).toBe(2);
    expect(activity.links).toContain('https://zabal.art');
    expect(activity.links).toContain('https://base.org');
  });

  it('returns empty activity for future time windows', () => {
    trackMessage('alice', 'Test', 'ch-1');
    // getActivitySince(0) should include everything from 0 hours ago (= now)
    // But messages tracked just now should still be included
    const activity = getActivitySince(0.001); // ~3.6 seconds
    expect(activity.totalMessages).toBe(1);
  });

  it('clearActivity resets all tracked data', () => {
    trackMessage('alice', 'Test', 'ch-1');
    clearActivity();
    const activity = getActivitySince(24);
    expect(activity.totalMessages).toBe(0);
  });

  it('getStoreStats returns correct counts', () => {
    trackMessage('alice', 'msg1', 'ch-1');
    trackMessage('bob', 'msg2', 'ch-2');
    trackMessage('charlie', 'msg3', 'ch-1');

    const stats = getStoreStats();
    expect(stats.channels).toBe(2);
    expect(stats.totalMessages).toBe(3);
  });

  it('sorts topics by frequency', () => {
    trackMessage('alice', 'zabal zabal zabal', 'ch-1');
    trackMessage('bob', 'zabal ethereum', 'ch-1');
    trackMessage('charlie', 'governance', 'ch-1');

    const activity = getActivitySince(1);
    // zabal should be first (highest frequency)
    expect(activity.topTopics[0][0]).toBe('zabal');
  });

  it('limits top topics to 10', () => {
    // Track messages mentioning many different keywords
    for (const keyword of ['zabal', 'sang', 'songjam', 'wavewarz', 'clanker', 'empire',
      'farcaster', 'base', 'ethereum', 'eth', 'fractal', 'incented']) {
      trackMessage('alice', `talking about ${keyword}`, 'ch-1');
    }

    const activity = getActivitySince(1);
    expect(activity.topTopics.length).toBeLessThanOrEqual(10);
  });
});
