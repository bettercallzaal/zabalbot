import { describe, expect, it, beforeEach } from 'bun:test';
import type { HandlerCallback, Memory, State } from '@elizaos/core';
import { v4 as uuidv4 } from 'uuid';
import plugin from '../plugin';
import { trackMessage, clearActivity } from '../tracker';
import { clearCache } from '../cache';

const mockRuntime = {} as any;
const mockState: State = { values: {}, data: {}, text: '' };

function createMsg(text: string): Memory {
  return {
    entityId: uuidv4(),
    roomId: uuidv4(),
    content: { text, source: 'test' },
  } as Memory;
}

describe('Error Handling', () => {
  beforeEach(() => {
    clearActivity();
    clearCache();
  });

  describe('Action Handlers with Empty/Invalid Input', () => {
    it('COMMUNITY_RECAP handles empty activity gracefully', async () => {
      const action = plugin.actions!.find((a) => a.name === 'COMMUNITY_RECAP')!;
      let responseText = '';
      const callback: HandlerCallback = async (r: any) => { responseText = r.text; };

      await action.handler(mockRuntime, createMsg('recap'), mockState, {}, callback, []);
      expect(responseText).toContain('No activity tracked');
    });

    it('WHO_ACTIVE handles empty activity gracefully', async () => {
      const action = plugin.actions!.find((a) => a.name === 'WHO_ACTIVE')!;
      let responseText = '';
      const callback: HandlerCallback = async (r: any) => { responseText = r.text; };

      await action.handler(mockRuntime, createMsg("who's active"), mockState, {}, callback, []);
      expect(responseText).toContain('No activity tracked');
    });

    it('COMMUNITY_RECAP works with tracked activity', async () => {
      trackMessage('alice', 'testing zabal features', 'ch-1');
      trackMessage('bob', 'great ethereum work', 'ch-1');

      const action = plugin.actions!.find((a) => a.name === 'COMMUNITY_RECAP')!;
      let responseText = '';
      const callback: HandlerCallback = async (r: any) => { responseText = r.text; };

      await action.handler(mockRuntime, createMsg('recap'), mockState, {}, callback, []);
      expect(responseText).toContain('Community Recap');
      expect(responseText).toContain('alice');
      expect(responseText).toContain('bob');
    });
  });

  describe('Validation Edge Cases', () => {
    it('validate handles message with no content text', async () => {
      const action = plugin.actions!.find((a) => a.name === 'TOKEN_INFO')!;
      const emptyMsg = { entityId: uuidv4(), roomId: uuidv4(), content: {} } as Memory;
      const result = await action.validate(mockRuntime, emptyMsg, mockState);
      expect(result).toBe(false);
    });

    it('validate handles null content gracefully', async () => {
      const action = plugin.actions!.find((a) => a.name === 'EMPIRE_INFO')!;
      const nullMsg = { entityId: uuidv4(), roomId: uuidv4(), content: { text: undefined } } as any;
      const result = await action.validate(mockRuntime, nullMsg, mockState);
      expect(result).toBe(false);
    });
  });

  describe('MESSAGE_RECEIVED Error Resilience', () => {
    it('should not throw on malformed event params', async () => {
      const handler = plugin.events!.MESSAGE_RECEIVED![0];

      // None of these should throw
      await handler({});
      await handler({ message: null });
      await handler({ message: { content: undefined } });
      await handler({ message: { content: { text: '' }, userName: '' } });

      // Bot should still be functional
      expect(true).toBe(true);
    });
  });
});
