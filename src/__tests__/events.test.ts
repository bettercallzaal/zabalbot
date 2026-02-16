import { describe, expect, it, beforeEach } from 'bun:test';
import plugin from '../plugin';
import { clearActivity, getActivitySince } from '../tracker';

describe('MESSAGE_RECEIVED Event', () => {
  beforeEach(() => {
    clearActivity();
  });

  it('should have a MESSAGE_RECEIVED handler', () => {
    expect(plugin.events).toBeDefined();
    expect(plugin.events!.MESSAGE_RECEIVED).toBeDefined();
    expect(plugin.events!.MESSAGE_RECEIVED!.length).toBe(1);
  });

  it('should track messages from event params', async () => {
    const handler = plugin.events!.MESSAGE_RECEIVED![0];

    await handler({
      message: {
        content: { text: 'Hello from Discord!' },
        userName: 'alice',
        channelId: 'test-channel',
      },
    });

    const activity = getActivitySince(1);
    expect(activity.totalMessages).toBe(1);
    expect(activity.contributors.get('alice')).toBe(1);
  });

  it('should not track messages from ZABAL itself', async () => {
    const handler = plugin.events!.MESSAGE_RECEIVED![0];

    await handler({
      message: {
        content: { text: 'I am ZABAL' },
        userName: 'ZABAL',
        channelId: 'test-channel',
      },
    });

    const activity = getActivitySince(1);
    expect(activity.totalMessages).toBe(0);
  });

  it('should handle missing fields gracefully', async () => {
    const handler = plugin.events!.MESSAGE_RECEIVED![0];

    // Should not throw
    await handler({});
    await handler({ message: {} });
    await handler({ message: { content: null } });

    const activity = getActivitySince(1);
    expect(activity.totalMessages).toBe(0);
  });

  it('should track topic keywords from messages', async () => {
    const handler = plugin.events!.MESSAGE_RECEIVED![0];

    await handler({
      message: {
        content: { text: 'The zabal ecosystem and ethereum governance is great' },
        userName: 'bob',
        channelId: 'test-channel',
      },
    });

    const activity = getActivitySince(1);
    expect(activity.topTopics.length).toBeGreaterThan(0);
    const topicNames = activity.topTopics.map(([name]) => name);
    expect(topicNames).toContain('zabal');
    expect(topicNames).toContain('ethereum');
    expect(topicNames).toContain('governance');
  });
});
