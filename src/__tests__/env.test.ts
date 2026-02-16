import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'bun:test';

describe('Environment Setup', () => {
  it('should verify configuration files exist', () => {
    const requiredFiles = ['package.json', 'tsconfig.json'];
    for (const file of requiredFiles) {
      expect(fs.existsSync(path.join(process.cwd(), file))).toBe(true);
    }
  });

  it('should have proper src directory structure', () => {
    const srcDir = path.join(process.cwd(), 'src');
    expect(fs.existsSync(srcDir)).toBe(true);

    const requiredFiles = ['index.ts', 'plugin.ts', 'character.ts', 'constants.ts', 'cache.ts', 'tracker.ts'];
    for (const file of requiredFiles) {
      expect(fs.existsSync(path.join(srcDir, file))).toBe(true);
    }
  });

  it('should have a valid package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    expect(packageJson).toHaveProperty('name', 'zabal-agent');
    expect(packageJson).toHaveProperty('type', 'module');
    expect(packageJson.dependencies).toHaveProperty('@elizaos/core');
    expect(packageJson.scripts).toHaveProperty('build');
  });

  it('should have a valid tsconfig.json', () => {
    const tsconfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tsconfig.json'), 'utf8'));
    expect(tsconfig).toHaveProperty('compilerOptions');
    expect(tsconfig.compilerOptions).toHaveProperty('target');
  });
});
