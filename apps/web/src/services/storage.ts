import { openDB } from 'idb';
import {
  workspaceSchema,
  preferencesSchema,
  type Preferences,
  type Workspace,
} from '@atlas/contracts';
import { seedWorkspace } from '@atlas/mock-data';

export function migrateWorkspace(value: unknown): Workspace {
  if (typeof value === 'object' && value !== null && 'version' in value && value.version === 1) {
    const old = value as Record<string, unknown>;
    return workspaceSchema.parse({
      ...old,
      version: 2,
      preferences: {
        theme: 'system',
        onboarding: false,
        snap: true,
        minimap: true,
        ...(typeof old.preferences === 'object' ? old.preferences : {}),
      },
    });
  }
  return workspaceSchema.parse(value);
}
export function parseImport(text: string): Workspace {
  if (text.length > 5_000_000)
    throw Error('Import is too large. Keep workspace exports under 5 MB.');
  return migrateWorkspace(JSON.parse(text) as unknown);
}
const dbPromise = () =>
  openDB('atlas-studio', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('workspace')) db.createObjectStore('workspace');
    },
  });
export function cachePreferences(preferences: Preferences) {
  try {
    localStorage.setItem('atlas-preferences-v2', JSON.stringify(preferences));
  } catch {
    /* IndexedDB remains the authoritative workspace when small synchronous storage is blocked. */
  }
}
function restorePreferences(workspace: Workspace): Workspace {
  try {
    const cached = localStorage.getItem('atlas-preferences-v2');
    if (cached) {
      const parsed = preferencesSchema.safeParse(JSON.parse(cached) as unknown);
      if (parsed.success) return { ...workspace, preferences: parsed.data };
    }
  } catch {
    /* Ignore a corrupt optional preference cache. */
  }
  return workspace;
}
export async function loadWorkspace(): Promise<{ workspace: Workspace; warning?: string }> {
  try {
    const db = await dbPromise();
    const saved: unknown = await db.get('workspace', 'current');
    db.close();
    return { workspace: restorePreferences(saved ? migrateWorkspace(saved) : seedWorkspace()) };
  } catch (error) {
    try {
      const cached = localStorage.getItem('atlas-fallback');
      if (cached)
        return {
          workspace: restorePreferences(parseImport(cached)),
          warning: 'IndexedDB is unavailable. Changes are saved to limited browser storage.',
        };
    } catch {
      /* Fall through to an isolated in-memory workspace. */
    }
    return {
      workspace: restorePreferences(seedWorkspace()),
      warning: `Storage could not be loaded. A fresh workspace is open in memory. Export your changes before leaving. ${error instanceof Error ? error.message : ''}`,
    };
  }
}
export async function persistWorkspace(workspace: Workspace): Promise<string | undefined> {
  if (!workspaceSchema.safeParse(workspace).success) {
    return 'Complete the required field values to save. Changes are in memory; your last valid workspace remains stored.';
  }
  try {
    const db = await dbPromise();
    await db.put('workspace', workspace, 'current');
    db.close();
    return;
  } catch {
    try {
      localStorage.setItem('atlas-fallback', JSON.stringify(workspace));
      return 'IndexedDB is unavailable. Using limited local storage; export a backup.';
    } catch {
      return 'Browser storage is unavailable. Changes are in memory only. Export your workspace before leaving.';
    }
  }
}
export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
