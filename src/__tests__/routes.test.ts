import { describe, expect, it } from 'bun:test';
import plugin from '../plugin';

describe('Plugin Routes', () => {
  it('should not define custom routes (no REST API needed)', () => {
    // ZABAL uses actions/providers/services, not custom HTTP routes
    // The old /helloworld route was removed with the starter code
    expect(plugin.routes).toBeUndefined();
  });
});
