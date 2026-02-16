import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function directoryExists(dirPath: string): boolean {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

describe('Project Structure Validation', () => {
  const rootDir = path.resolve(__dirname, '../..');

  describe('Directory Structure', () => {
    it('should have the expected directory structure', () => {
      expect(directoryExists(path.join(rootDir, 'src'))).toBe(true);
      expect(directoryExists(path.join(rootDir, 'src', '__tests__'))).toBe(true);
      expect(directoryExists(path.join(rootDir, 'src', 'actions'))).toBe(true);
      expect(directoryExists(path.join(rootDir, 'src', 'api'))).toBe(true);
      expect(directoryExists(path.join(rootDir, 'src', 'providers'))).toBe(true);
      expect(directoryExists(path.join(rootDir, 'src', 'services'))).toBe(true);
    });
  });

  describe('Source Files', () => {
    it('should contain core source files', () => {
      const coreFiles = ['index.ts', 'plugin.ts', 'character.ts', 'constants.ts', 'cache.ts', 'tracker.ts'];
      for (const file of coreFiles) {
        expect(fileExists(path.join(rootDir, 'src', file))).toBe(true);
      }
    });

    it('should contain action modules', () => {
      const actionFiles = ['token-info.ts', 'empire-info.ts', 'recap.ts', 'who-active.ts'];
      for (const file of actionFiles) {
        expect(fileExists(path.join(rootDir, 'src', 'actions', file))).toBe(true);
      }
    });

    it('should contain API modules', () => {
      const apiFiles = ['dexscreener.ts', 'empire.ts', 'farcaster.ts'];
      for (const file of apiFiles) {
        expect(fileExists(path.join(rootDir, 'src', 'api', file))).toBe(true);
      }
    });

    it('should contain provider modules', () => {
      const providerFiles = ['token-data.ts', 'activity-context.ts', 'farcaster-social.ts'];
      for (const file of providerFiles) {
        expect(fileExists(path.join(rootDir, 'src', 'providers', file))).toBe(true);
      }
    });

    it('should contain service modules', () => {
      expect(fileExists(path.join(rootDir, 'src', 'services', 'slash-commands.ts'))).toBe(true);
    });

    it('plugin.ts should be a clean assembly file', () => {
      const pluginContent = fs.readFileSync(path.join(rootDir, 'src', 'plugin.ts'), 'utf8');
      expect(pluginContent).toContain('export default');
      expect(pluginContent).toContain('actions');
      expect(pluginContent).toContain('providers');
      expect(pluginContent).toContain('services');
      // Should NOT contain implementation code — just imports and assembly
      expect(pluginContent).not.toContain('async function fetch');
      expect(pluginContent).not.toContain('interface DexScreenerPair');
    });
  });

  describe('Configuration Files', () => {
    it('should have required config files', () => {
      expect(fileExists(path.join(rootDir, 'package.json'))).toBe(true);
      expect(fileExists(path.join(rootDir, 'tsconfig.json'))).toBe(true);
    });

    it('should have correct package name', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
      expect(packageJson.name).toBe('zabal-agent');
      expect(packageJson.dependencies).toHaveProperty('@elizaos/core');
    });
  });
});
