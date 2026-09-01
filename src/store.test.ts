import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getState,
  getSaveStatus,
  getLastSaveError,
  resetStore,
  addPerson,
  deletePerson,
  addDevice,
  deleteDevice,
  addAccount,
  updateAccount,
  deleteAccount,
  addBackup,
  addDependency,
  addReviewItem,
  addRecoveryReference,
  deleteRecoveryReference,
  subscribe,
  setOnboardingComplete,
  importBackup,
  flushSave,
} from './store';
import { clearState } from './db';
import { buildFullExport } from './services/export';
import { parseImport } from './services/import';
import * as db from './db';

describe('store', () => {
  beforeEach(async () => {
    await clearState();
    resetStore();
  });

  it('starts with default Me', () => {
    expect(getState().people).toHaveLength(1);
    expect(getState().people[0].role).toBe('me');
  });

  it('notifies subscribers on change', () => {
    const cb = vi.fn();
    const unsubscribe = subscribe(cb);
    addDevice({
      label: 'MacBook Air',
      role: 'Main computer',
      category: 'computer',
      ownerIds: [getState().people[0].id],
    });
    expect(cb).toHaveBeenCalled();
    unsubscribe();
  });

  it('adds and deletes a device', () => {
    const device = addDevice({
      label: 'MacBook Air',
      role: 'Main computer',
      category: 'computer',
      ownerIds: [],
    });
    expect(getState().devices).toHaveLength(1);
    deleteDevice(device.id);
    expect(getState().devices).toHaveLength(0);
  });

  it('marks onboarding complete', () => {
    setOnboardingComplete(true);
    expect(getState().onboardingComplete).toBe(true);
  });

  it('does not delete the Me person', () => {
    const me = getState().people[0];
    expect(me.role).toBe('me');
    const result = deletePerson(me.id);
    expect(result).toBe(false);
    expect(getState().people).toHaveLength(1);
  });

  it('adds, updates, and deletes an account', () => {
    const account = addAccount({ label: 'Email', provider: 'Fastmail' });
    expect(getState().accounts).toHaveLength(1);
    expect(getState().accounts[0].provider).toBe('Fastmail');

    const updated = updateAccount(account.id, { provider: 'Google' });
    expect(updated).not.toBeNull();
    expect(getState().accounts[0].provider).toBe('Google');

    deleteAccount(account.id);
    expect(getState().accounts).toHaveLength(0);
  });

  it('deleting an account removes dependencies on that account', () => {
    const account = addAccount({ label: 'Bank' });
    const device = addDevice({
      label: 'iPhone',
      role: 'Phone',
      category: 'phone',
      ownerIds: [],
    });
    addDependency({ sourceId: device.id, targetId: account.id, kind: 'authenticates-with' });
    expect(getState().dependencies).toHaveLength(1);

    deleteAccount(account.id);
    expect(getState().dependencies).toHaveLength(0);
  });

  it('deleting a device removes it from backup coversIds', () => {
    const device = addDevice({
      label: 'MacBook',
      role: 'Main computer',
      category: 'computer',
      ownerIds: [],
    });
    addBackup({ label: 'Time Machine', coversIds: [device.id] });
    expect(getState().backups[0].coversIds).toContain(device.id);

    deleteDevice(device.id);
    expect(getState().backups[0].coversIds).not.toContain(device.id);
  });

  it('deleting a person removes dependencies on that person', () => {
    const partner = addPerson({ name: 'Partner', role: 'partner' });
    const account = addAccount({ label: 'Shared streaming' });
    addDependency({ sourceId: account.id, targetId: partner.id, kind: 'requires' });
    expect(getState().dependencies).toHaveLength(1);

    deletePerson(partner.id);
    expect(getState().dependencies).toHaveLength(0);
  });

  it('deleting a recovery reference removes it from linkedEntityIds and dependencies', () => {
    const ref = addRecoveryReference({ label: 'Safe code sheet', kind: 'printed-sheet' });
    const account = addAccount({ label: 'Vault' });
    const review = addReviewItem({ title: 'Check recovery refs', linkedEntityIds: [ref.id] });
    addDependency({ sourceId: account.id, targetId: ref.id, kind: 'requires' });

    deleteRecoveryReference(ref.id);
    expect(getState().dependencies).toHaveLength(0);
    expect(getState().reviewItems.find(r => r.id === review.id)?.linkedEntityIds).not.toContain(ref.id);
  });

  it('imports a backup and replaces state', () => {
    const cb = vi.fn();
    const unsubscribe = subscribe(cb);
    const backup = {
      schemaVersion: 1,
      exportedAt: '2024-01-01T00:00:00Z',
      people: [{ id: 'p-import', name: 'Imported', role: 'other' as const, notes: '', visibility: 'private' as const }],
      devices: [],
      accounts: [],
      backups: [],
      recoveryReferences: [],
      dependencies: [],
      reviewItems: [],
      onboardingComplete: true,
      lastExportAt: '2024-01-01T00:00:00Z',
    };
    importBackup(backup);
    expect(getState().people).toHaveLength(1);
    expect(getState().people[0].name).toBe('Imported');
    expect(getState().onboardingComplete).toBe(true);
    expect(cb).toHaveBeenCalled();
    unsubscribe();
  });

  it('tracks save status through flush', async () => {
    addDevice({ label: 'Phone', role: 'Phone', category: 'phone', ownerIds: [] });
    expect(getSaveStatus()).toBe('saving');
    await flushSave();
    expect(getSaveStatus()).toBe('saved');
  });

  it('surfaces save errors in status', async () => {
    vi.spyOn(db, 'saveState').mockRejectedValueOnce(new Error('Storage is full'));
    addDevice({ label: 'Phone', role: 'Phone', category: 'phone', ownerIds: [] });
    await flushSave();
    expect(getSaveStatus()).toBe('error');
    expect(getLastSaveError()).toContain('Storage is full');
    vi.restoreAllMocks();
  });

  it('recovery drill: exported state can be cleared and restored', async () => {
    const me = getState().people[0].id;
    addDevice({ label: 'MacBook', role: 'Main computer', category: 'computer', ownerIds: [me] });
    await flushSave();

    const exported = buildFullExport(getState());
    const json = JSON.stringify(exported);

    resetStore();
    expect(getState().devices).toHaveLength(0);

    const parsed = parseImport(json);
    expect(parsed.success).toBe(true);
    if (parsed.data) {
      importBackup(parsed.data);
    }
    expect(getState().devices).toHaveLength(1);
    expect(getState().devices[0].label).toBe('MacBook');
  });
});
