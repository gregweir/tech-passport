import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadState, saveState, clearState, PersistenceError } from './db';
import { DEFAULT_ME } from './constants';
import type { AppState } from './types';

describe('db', () => {
  beforeEach(async () => {
    await clearState();
  });

  it('loads default state when empty', async () => {
    const state = await loadState();
    expect(state.people).toHaveLength(1);
    expect(state.people[0].id).toBe(DEFAULT_ME.id);
  });

  it('round-trips state', async () => {
    const state: AppState = {
      schemaVersion: 1,
      people: [DEFAULT_ME],
      devices: [],
      accounts: [],
      backups: [],
      recoveryReferences: [],
      dependencies: [],
      reviewItems: [],
      onboardingComplete: false,
      lastExportAt: '',
    };
    await saveState(state);
    const loaded = await loadState();
    expect(loaded.people[0].id).toBe(DEFAULT_ME.id);
    expect(loaded.onboardingComplete).toBe(false);
  });

  it('removes stale records when a collection shrinks', async () => {
    const withDevice: AppState = {
      schemaVersion: 1,
      people: [DEFAULT_ME],
      devices: [{
        id: 'device-1',
        label: 'Phone',
        role: 'primary',
        category: 'phone',
        ownerIds: [DEFAULT_ME.id],
        model: '',
        os: '',
        serialNumber: '',
        purchaseDate: '',
        location: '',
        encrypted: 'unknown',
        recoveryReferenceIds: [],
        notes: '',
        visibility: 'private',
        reviewDate: '',
      }],
      accounts: [],
      backups: [],
      recoveryReferences: [],
      dependencies: [],
      reviewItems: [],
      onboardingComplete: false,
      lastExportAt: '',
    };

    const withoutDevice: AppState = {
      ...withDevice,
      devices: [],
    };

    await saveState(withDevice);
    const loadedWithDevice = await loadState();
    expect(loadedWithDevice.devices).toHaveLength(1);

    await saveState(withoutDevice);
    const loadedWithoutDevice = await loadState();
    expect(loadedWithoutDevice.devices).toHaveLength(0);
  });

  it('surfaces IndexedDB errors as PersistenceError', async () => {
    const state: AppState = {
      schemaVersion: 1,
      people: [DEFAULT_ME],
      devices: [], accounts: [], backups: [],
      recoveryReferences: [], dependencies: [], reviewItems: [],
      onboardingComplete: false, lastExportAt: '',
    };
    const fakeError = new Error('Storage is full. Free up space or export your Passport before continuing.');
    fakeError.name = 'QuotaExceededError';
    vi.stubGlobal('indexedDB', {
      open: () => {
        const request = {
          set onsuccess(_fn: () => void) {},
          set onerror(fn: (e: Event) => void) { fn({} as Event); },
          set onupgradeneeded(_fn: () => void) {},
          error: fakeError,
        };
        return request;
      },
    });
    await expect(saveState(state)).rejects.toThrow(PersistenceError);
    vi.unstubAllGlobals();
  });
});
