import { describe, expect, it, beforeEach } from 'bun:test';
import type { Memory, State } from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import plugin from '../plugin';
import { trackMessage, clearActivity } from '../tracker';

const mockRuntime = {} as any;
const mockState: State = { values: {}, data: {}, text: '' };
const mockMessage: Memory = {
  entityId: uuidv4(),
  roomId: uuidv4(),
  content: { text: 'test', source: 'test' },
} as Memory;

describe('Provider Registration', () => {
  it('should include 3 providers', () => {
    expect(plugin.providers).toBeDefined();
    expect(plugin.providers!.length).toBe(3);
  });

  it('every provider should have name, description, and get method', () => {
    for (const provider of plugin.providers!) {
      expect(provider.name).toBeTruthy();
      expect(provider.description).toBeTruthy();
      expect(typeof provider.get).toBe('function');
    }
  });
});

describe('ACTIVITY_CONTEXT_PROVIDER', () => {
  const provider = plugin.providers!.find((p) => p.name === 'ACTIVITY_CONTEXT_PROVIDER')!;

  beforeEach(() => {
    clearActivity();
  });

  it('returns empty text when no activity', async () => {
    const result = await provider.get(mockRuntime, mockMessage, mockState);
    expect(result.text).toBe('');
  });

  it('returns activity context after messages are tracked', async () => {
    trackMessage('alice', 'Hello everyone, talking about zabal!', 'channel-1');
    trackMessage('bob', 'Great point about governance', 'channel-1');
    trackMessage('alice', 'Lets discuss the token price', 'channel-1');

    const result = await provider.get(mockRuntime, mockMessage, mockState);
    expect(result.text).toContain('community activity');
    expect(result.text).toContain('3 messages');
    expect(result.text).toContain('2 contributors');
    expect(result.text).toContain('alice');
  });
});

describe('FARCASTER_SOCIAL_PROVIDER', () => {
  const provider = plugin.providers!.find((p) => p.name === 'FARCASTER_SOCIAL_PROVIDER')!;

  it('returns empty text when no API key is set', async () => {
    const originalKey = process.env.FARCASTER_NEYNAR_API_KEY;
    delete process.env.FARCASTER_NEYNAR_API_KEY;

    const result = await provider.get(mockRuntime, mockMessage, mockState);
    expect(result.text).toBe('');

    if (originalKey) {
      process.env.FARCASTER_NEYNAR_API_KEY = originalKey;
    }
  });
});

describe('TOKEN_DATA_PROVIDER', () => {
  const provider = plugin.providers!.find((p) => p.name === 'TOKEN_DATA_PROVIDER')!;

  it('exists and has correct structure', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBe('TOKEN_DATA_PROVIDER');
    expect(typeof provider.get).toBe('function');
  });
});
