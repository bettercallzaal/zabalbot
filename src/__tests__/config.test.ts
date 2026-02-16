import { describe, expect, it } from 'bun:test';
import plugin from '../plugin';

describe('ZABAL Plugin Configuration', () => {
  it('should accept empty configuration on init', async () => {
    // ZABAL plugin has no required config — all API keys come from env vars
    await expect(plugin.init!({}, {} as any)).resolves.toBeUndefined();
  });

  it('should accept arbitrary config without errors', async () => {
    await expect(
      plugin.init!({ SOME_KEY: 'some-value' }, {} as any)
    ).resolves.toBeUndefined();
  });

  it('should have empty config object', () => {
    expect(plugin.config).toBeDefined();
    expect(Object.keys(plugin.config!).length).toBe(0);
  });
});
