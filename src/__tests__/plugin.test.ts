import { describe, expect, it } from 'bun:test';
import plugin from '../plugin';

describe('ZABAL Plugin Configuration', () => {
  it('should have correct plugin metadata', () => {
    expect(plugin.name).toBe('zabal');
    expect(plugin.description).toContain('ZABAL');
    expect(plugin.priority).toBe(0);
  });

  it('should register all 4 actions', () => {
    expect(plugin.actions).toBeDefined();
    expect(plugin.actions!.length).toBe(4);

    const actionNames = plugin.actions!.map((a) => a.name);
    expect(actionNames).toContain('TOKEN_INFO');
    expect(actionNames).toContain('EMPIRE_INFO');
    expect(actionNames).toContain('COMMUNITY_RECAP');
    expect(actionNames).toContain('WHO_ACTIVE');
  });

  it('should register all 3 providers', () => {
    expect(plugin.providers).toBeDefined();
    expect(plugin.providers!.length).toBe(3);

    const providerNames = plugin.providers!.map((p) => p.name);
    expect(providerNames).toContain('TOKEN_DATA_PROVIDER');
    expect(providerNames).toContain('ACTIVITY_CONTEXT_PROVIDER');
    expect(providerNames).toContain('FARCASTER_SOCIAL_PROVIDER');
  });

  it('should register the SlashCommandService', () => {
    expect(plugin.services).toBeDefined();
    expect(plugin.services!.length).toBe(1);
  });

  it('should have MESSAGE_RECEIVED event handler', () => {
    expect(plugin.events).toBeDefined();
    expect(plugin.events!.MESSAGE_RECEIVED).toBeDefined();
    expect(plugin.events!.MESSAGE_RECEIVED!.length).toBe(1);
    expect(typeof plugin.events!.MESSAGE_RECEIVED![0]).toBe('function');
  });

  it('should initialize without errors', async () => {
    await expect(plugin.init!({}, {} as any)).resolves.toBeUndefined();
  });

  it('should have unique action names', () => {
    const names = plugin.actions!.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('should have unique provider names', () => {
    const names = plugin.providers!.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every action should have required fields', () => {
    for (const action of plugin.actions!) {
      expect(action.name).toBeTruthy();
      expect(action.description).toBeTruthy();
      expect(typeof action.validate).toBe('function');
      expect(typeof action.handler).toBe('function');
      expect(Array.isArray(action.similes)).toBe(true);
      expect(Array.isArray(action.examples)).toBe(true);
      expect(action.examples!.length).toBeGreaterThan(0);
    }
  });

  it('every provider should have required fields', () => {
    for (const provider of plugin.providers!) {
      expect(provider.name).toBeTruthy();
      expect(provider.description).toBeTruthy();
      expect(typeof provider.get).toBe('function');
    }
  });
});
