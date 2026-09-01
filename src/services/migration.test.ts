import { describe, it, expect } from 'vitest';
import { migrateBackup } from './migration';
import { SCHEMA_VERSION } from '../constants';

describe('migration', () => {
  it('returns current schema unchanged', () => {
    const backup = {
      schemaVersion: 1,
      exportedAt: '',
      people: [], devices: [], accounts: [], backups: [],
      recoveryReferences: [], dependencies: [], reviewItems: [],
      onboardingComplete: false, lastExportAt: '',
    };
    const result = migrateBackup(backup);
    expect(result.data?.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('renames do-not-export to backup-only', () => {
    const backup = {
      schemaVersion: 1,
      exportedAt: '',
      people: [{ id: 'p1', name: 'Me', role: 'me' as const, notes: '', visibility: 'do-not-export' as const }],
      devices: [], accounts: [], backups: [],
      recoveryReferences: [], dependencies: [], reviewItems: [],
      onboardingComplete: false, lastExportAt: '',
    };
    const result = migrateBackup(backup);
    expect(result.data?.people[0].visibility).toBe('backup-only');
    expect(result.data?.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('sets source=app on the canonical unlinked export reminder', () => {
    const backup = {
      schemaVersion: 1,
      exportedAt: '',
      people: [], devices: [], accounts: [], backups: [],
      recoveryReferences: [], dependencies: [],
      reviewItems: [{
        id: 'ri-export', title: 'Export your Passport', recurrenceDays: 30, lastReviewedDate: '',
        nextReviewDate: '', status: 'due', notes: '', linkedEntityIds: [],
      }],
      onboardingComplete: false, lastExportAt: '',
    };
    const result = migrateBackup(backup as unknown as Parameters<typeof migrateBackup>[0]);
    expect(result.data?.reviewItems[0].source).toBe('app');
  });

  it('sets source=user on arbitrary review items', () => {
    const backup = {
      schemaVersion: 1,
      exportedAt: '',
      people: [], devices: [], accounts: [], backups: [],
      recoveryReferences: [], dependencies: [],
      reviewItems: [{
        id: 'ri-other', title: 'My reminder', recurrenceDays: null, lastReviewedDate: '',
        nextReviewDate: '', status: 'ok', notes: '', linkedEntityIds: [],
      }],
      onboardingComplete: false, lastExportAt: '',
    };
    const result = migrateBackup(backup as unknown as Parameters<typeof migrateBackup>[0]);
    expect(result.data?.reviewItems[0].source).toBe('user');
  });
});
