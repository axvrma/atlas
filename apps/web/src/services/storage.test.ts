import { describe, expect, it } from 'vitest';
import { seedWorkspace } from '@atlas/mock-data';
import { loadWorkspace, migrateWorkspace, parseImport, persistWorkspace } from './storage';
describe('versioned browser data', () => {
  it('roundtrips validated JSON with execution snapshots', () => {
    const workspace = seedWorkspace();
    expect(parseImport(JSON.stringify(workspace))).toEqual(workspace);
  });
  it('migrates schema 1 explicitly and rejects unknown versions', () => {
    const old = {
      ...seedWorkspace(),
      version: 1,
      preferences: { theme: 'dark', onboarding: true },
    };
    const migrated = migrateWorkspace(old);
    expect(migrated.version).toBe(2);
    expect(migrated.preferences.snap).toBe(true);
    expect(migrated.preferences.theme).toBe('dark');
    expect(() => migrateWorkspace({ ...old, version: 50 })).toThrow();
  });
  it('rejects corrupt, oversized and malformed imports', () => {
    expect(() => parseImport('{broken')).toThrow();
    expect(() => parseImport(' '.repeat(5_000_001))).toThrow('too large');
    const bad = seedWorkspace();
    bad.workflows[0]!.nodes[0]!.position.x = NaN;
    expect(() => parseImport(JSON.stringify(bad))).toThrow();
  });
  it('persists and reloads actual changes through IndexedDB', async () => {
    const workspace = seedWorkspace();
    workspace.workflows[0]!.name = 'Persistence verified';
    expect(await persistWorkspace(workspace)).toBeUndefined();
    const loaded = await loadWorkspace();
    expect(loaded.workspace.workflows[0]?.name).toBe('Persistence verified');
    expect(loaded.workspace.executions).toEqual(workspace.executions);
  });
});

it('recovers from IndexedDB unavailability with an explicit storage warning', async () => {
  const { vi } = await import('vitest');
  const broken = vi.spyOn(indexedDB, 'open').mockImplementation(() => {
    throw new Error('Blocked');
  });
  try {
    const workspace = seedWorkspace();
    expect(await persistWorkspace(workspace)).toContain('local storage');
    expect((await loadWorkspace()).warning).toContain('IndexedDB');
    localStorage.removeItem('atlas-fallback');
    const loaded = await loadWorkspace();
    expect(loaded.warning).toContain('memory');
    expect(loaded.workspace.workflows).toHaveLength(5);
  } finally {
    broken.mockRestore();
    localStorage.clear();
  }
});

it('preserves the last valid save when a required field is temporarily empty', async () => {
  const valid = seedWorkspace();
  await persistWorkspace(valid);
  const invalid = structuredClone(valid);
  invalid.workflows[0]!.name = '';
  expect(await persistWorkspace(invalid)).toContain('last valid workspace');
  expect((await loadWorkspace()).workspace.workflows[0]!.name).toBe(valid.workflows[0]!.name);
});
