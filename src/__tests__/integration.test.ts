import { logger } from '@elizaos/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test';
import { character } from '../index';
import plugin from '../plugin';

beforeAll(() => {
  spyOn(logger, 'info').mockImplementation(() => {});
  spyOn(logger, 'error').mockImplementation(() => {});
  spyOn(logger, 'warn').mockImplementation(() => {});
  spyOn(logger, 'debug').mockImplementation(() => {});
});

afterAll(() => {});

describe('Integration: Project Structure', () => {
  it('should have required source files', () => {
    const srcDir = path.join(process.cwd(), 'src');
    expect(fs.existsSync(srcDir)).toBe(true);

    const requiredFiles = ['index.ts', 'plugin.ts', 'character.ts', 'constants.ts', 'cache.ts', 'tracker.ts'];
    for (const file of requiredFiles) {
      expect(fs.existsSync(path.join(srcDir, file))).toBe(true);
    }
  });

  it('should have modular directory structure', () => {
    const srcDir = path.join(process.cwd(), 'src');
    const requiredDirs = ['actions', 'api', 'providers', 'services'];
    for (const dir of requiredDirs) {
      expect(fs.existsSync(path.join(srcDir, dir))).toBe(true);
    }
  });

  it('should have action modules', () => {
    const actionsDir = path.join(process.cwd(), 'src', 'actions');
    const requiredActions = ['token-info.ts', 'empire-info.ts', 'recap.ts', 'who-active.ts'];
    for (const file of requiredActions) {
      expect(fs.existsSync(path.join(actionsDir, file))).toBe(true);
    }
  });

  it('should have API modules', () => {
    const apiDir = path.join(process.cwd(), 'src', 'api');
    const requiredAPIs = ['dexscreener.ts', 'empire.ts', 'farcaster.ts'];
    for (const file of requiredAPIs) {
      expect(fs.existsSync(path.join(apiDir, file))).toBe(true);
    }
  });

  it('should have provider modules', () => {
    const providersDir = path.join(process.cwd(), 'src', 'providers');
    const requiredProviders = ['token-data.ts', 'activity-context.ts', 'farcaster-social.ts'];
    for (const file of requiredProviders) {
      expect(fs.existsSync(path.join(providersDir, file))).toBe(true);
    }
  });
});

describe('Integration: Character and Plugin', () => {
  it('character should have ZABAL identity', () => {
    expect(character.name).toBe('ZABAL');
    expect(character.system).toContain('coordination intelligence');
  });

  it('character should reference ecosystem tokens', () => {
    const knowledge = character.knowledge?.join(' ') ?? '';
    expect(knowledge).toContain('ZABAL');
    expect(knowledge).toContain('SANG');
    expect(knowledge).toContain('Base');
  });

  it('plugin should integrate with character actions', () => {
    // Character message examples reference actions that plugin provides
    const pluginActionNames = new Set(plugin.actions!.map((a) => a.name));
    const exampleActions = character.messageExamples
      ?.flatMap((ex) => ex.flatMap((msg) => msg.content.actions ?? []))
      ?? [];

    for (const actionName of exampleActions) {
      if (actionName) {
        expect(pluginActionNames.has(actionName)).toBe(true);
      }
    }
  });

  it('plugin init should work without runtime', async () => {
    await expect(plugin.init!({}, {} as any)).resolves.toBeUndefined();
  });
});
