import { describe, expect, it, beforeEach } from 'bun:test';
import type { HandlerCallback, Memory, State } from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import plugin from '../plugin';
import { detectToken } from '../actions/token-info';
import { clearActivity } from '../tracker';

function createMockMessage(text: string): Memory {
  return {
    entityId: uuidv4(),
    roomId: uuidv4(),
    content: { text, source: 'test' },
  } as Memory;
}

const mockState: State = { values: {}, data: {}, text: '' };
const mockRuntime = {} as any;

describe('TOKEN_INFO Action', () => {
  const action = plugin.actions!.find((a) => a.name === 'TOKEN_INFO')!;

  it('validates on ZABAL price query', async () => {
    const msg = createMockMessage("What's the ZABAL price?");
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('validates on SANG token query', async () => {
    const msg = createMockMessage('How is SANG trading?');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('validates on SongJam market query', async () => {
    const msg = createMockMessage("What's the songjam market cap?");
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('rejects unrelated messages', async () => {
    const msg = createMockMessage('Tell me a joke');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(false);
  });

  it('rejects token mention without price context', async () => {
    const msg = createMockMessage('I love zabal');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(false);
  });
});

describe('detectToken', () => {
  it('detects ZABAL', () => expect(detectToken('zabal price')).toBe('ZABAL'));
  it('detects $ZABAL', () => expect(detectToken('$ZABAL')).toBe('ZABAL'));
  it('detects SANG', () => expect(detectToken('sang trading')).toBe('SANG'));
  it('detects $SANG', () => expect(detectToken('$SANG')).toBe('SANG'));
  it('detects songjam as SANG', () => expect(detectToken('songjam')).toBe('SANG'));
  it('returns null for unknown', () => expect(detectToken('bitcoin')).toBeNull());
});

describe('EMPIRE_INFO Action', () => {
  const action = plugin.actions!.find((a) => a.name === 'EMPIRE_INFO')!;

  it('validates on empire query', async () => {
    const msg = createMockMessage('Show me the empire stats');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('validates on treasury query', async () => {
    const msg = createMockMessage("What's in the treasury?");
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('validates on burn query', async () => {
    const msg = createMockMessage('How much has been burned?');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('rejects unrelated messages', async () => {
    const msg = createMockMessage('What is the weather?');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(false);
  });
});

describe('COMMUNITY_RECAP Action', () => {
  const action = plugin.actions!.find((a) => a.name === 'COMMUNITY_RECAP')!;

  beforeEach(() => { clearActivity(); });

  it('validates on recap keyword', async () => {
    const msg = createMockMessage('recap');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('validates on "what did I miss"', async () => {
    const msg = createMockMessage('What did I miss today?');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('validates on "catch me up"', async () => {
    const msg = createMockMessage('Catch me up on what happened');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('rejects unrelated messages', async () => {
    const msg = createMockMessage('How do I deploy a contract?');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(false);
  });

  it('handler returns empty state message when no activity', async () => {
    const msg = createMockMessage('recap');
    let callbackText = '';
    const callback: HandlerCallback = async (response: any) => {
      callbackText = response.text;
    };
    await action.handler(mockRuntime, msg, mockState, {}, callback, []);
    expect(callbackText).toContain('No activity tracked');
  });
});

describe('WHO_ACTIVE Action', () => {
  const action = plugin.actions!.find((a) => a.name === 'WHO_ACTIVE')!;

  beforeEach(() => { clearActivity(); });

  it('validates on "who\'s active"', async () => {
    const msg = createMockMessage("Who's active?");
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('validates on "active contributors"', async () => {
    const msg = createMockMessage('Show me active contributors');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('validates on "community pulse"', async () => {
    const msg = createMockMessage('Show me the community pulse');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(true);
  });

  it('rejects unrelated messages', async () => {
    const msg = createMockMessage('What is Ethereum?');
    expect(await action.validate(mockRuntime, msg, mockState)).toBe(false);
  });

  it('handler returns empty state message when no activity', async () => {
    const msg = createMockMessage("Who's active?");
    let callbackText = '';
    const callback: HandlerCallback = async (response: any) => {
      callbackText = response.text;
    };
    await action.handler(mockRuntime, msg, mockState, {}, callback, []);
    expect(callbackText).toContain('No activity tracked');
  });
});
