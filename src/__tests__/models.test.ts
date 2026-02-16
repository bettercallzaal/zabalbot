import { describe, expect, it } from 'bun:test';
import plugin from '../plugin';

describe('Plugin Models', () => {
  it('should not define custom models (uses Anthropic plugin instead)', () => {
    // ZABAL plugin delegates model handling to @elizaos/plugin-anthropic
    // It should NOT override models — that was the old starter placeholder
    expect(plugin.models).toBeUndefined();
  });
});
