import { describe, it, expect } from 'vitest';
import { parseImport } from './import';
import { DEFAULT_ME } from '../constants';
import type { AppBackup } from '../types';

const validBackup: AppBackup = {
  schemaVersion: 1,
  exportedAt: '2024-01-01T00:00:00Z',
  people: [DEFAULT_ME],
  devices: [], accounts: [], backups: [],
  recoveryReferences: [], dependencies: [], reviewItems: [],
  onboardingComplete: true, lastExportAt: '',
};

function expectFailure(json: string, snippet: string) {
  const result = parseImport(json);
  expect(result.success).toBe(false);
  expect(result.error).toContain(snippet);
}

describe('import', () => {
  it('parses valid backup', () => {
    const result = parseImport(JSON.stringify(validBackup));
    expect(result.success).toBe(true);
    if (result.success && result.data) expect(result.data.people).toHaveLength(1);
  });

  it('rejects invalid JSON', () => {
    expectFailure('{not json}', 'not valid JSON');
  });

  it('rejects backup with wrong schema version', () => {
    const bad = { ...validBackup, schemaVersion: 999 };
    expectFailure(JSON.stringify(bad), 'newer version');
  });

  it('rejects missing schema version', () => {
    const { schemaVersion: _, ...bad } = validBackup;
    expectFailure(JSON.stringify(bad), 'schema version');
  });

  it('rejects non-object root', () => {
    expectFailure('[]', 'plain object');
    expectFailure('"string"', 'plain object');
  });

  it('rejects missing required top-level arrays', () => {
    expectFailure(JSON.stringify({ schemaVersion: 1, lastExportAt: '', onboardingComplete: true }), 'people');
  });

  it('rejects malformed person', () => {
    const bad = { ...validBackup, people: [{ id: 'p1' }] };
    expectFailure(JSON.stringify(bad), 'people[0].name');
  });

  it('rejects invalid enum values', () => {
    const bad = { ...validBackup, people: [{ id: 'p1', name: 'A', role: 'me', notes: '', visibility: 'super-public' }] };
    expectFailure(JSON.stringify(bad), 'visibility');
  });

  it('rejects duplicate ids', () => {
    const bad = { ...validBackup, people: [DEFAULT_ME, DEFAULT_ME] };
    expectFailure(JSON.stringify(bad), 'duplicate id');
  });

  it('rejects dangling references', () => {
    const bad = {
      ...validBackup,
      devices: [{ id: 'd1', label: 'D', role: 'R', category: 'other', ownerIds: ['missing'], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '' }],
    };
    expectFailure(JSON.stringify(bad), 'is not a person');
  });

  it('rejects oversized strings', () => {
    const bad = { ...validBackup, people: [{ id: 'p1', name: 'x'.repeat(6000), role: 'me', notes: '', visibility: 'private' }] };
    expectFailure(JSON.stringify(bad), 'exceeds');
  });

  it('rejects invalid dates', () => {
    const bad = {
      ...validBackup,
      devices: [{ id: 'd1', label: 'D', role: 'R', category: 'other', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: 'yesterday', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '' }],
    };
    expectFailure(JSON.stringify(bad), 'purchaseDate');
  });

  it('rejects too many records', () => {
    const people = Array.from({ length: 1001 }, (_, i) => ({ id: `p${i}`, name: `Person ${i}`, role: 'other', notes: '', visibility: 'private' }));
    expectFailure(JSON.stringify({ ...validBackup, people }), 'exceeds');
  });

  it('rejects schema 0', () => {
    expectFailure(JSON.stringify({ ...validBackup, schemaVersion: 0 }), 'schema version');
  });

  it('rejects non-numeric schema version', () => {
    expectFailure(JSON.stringify({ ...validBackup, schemaVersion: '1' }), 'schema version');
  });

  it('rejects wrong-type references', () => {
    const person = { id: 'p1', name: 'Me', role: 'me', notes: '', visibility: 'private' };
    const device = {
      id: 'd1', label: 'D', role: 'R', category: 'other', ownerIds: ['d1'], model: '', os: '',
      serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [],
      notes: '', visibility: 'private', reviewDate: '',
    };
    expectFailure(JSON.stringify({ ...validBackup, people: [person], devices: [device] }), 'is not a person');
  });

  it('rejects cross-type duplicate ids', () => {
    const person = { id: 'shared', name: 'Me', role: 'me', notes: '', visibility: 'private' };
    const device = {
      id: 'shared', label: 'D', role: 'R', category: 'other', ownerIds: [], model: '', os: '',
      serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [],
      notes: '', visibility: 'private', reviewDate: '',
    };
    expectFailure(JSON.stringify({ ...validBackup, people: [person], devices: [device] }), 'Duplicate id');
  });

  it('rejects invalid enum types including malformed non-string values', () => {
    const person = { id: 'p1', name: 'Me', role: 123, notes: '', visibility: 'private' };
    expectFailure(JSON.stringify({ ...validBackup, people: [person] }), 'must be a string');
  });

  it('rejects invalid recurrence values', () => {
    const item = {
      id: 'ri1', title: 'T', recurrenceDays: -1, lastReviewedDate: '', nextReviewDate: '',
      status: 'ok', notes: '', linkedEntityIds: [],
    };
    expectFailure(JSON.stringify({ ...validBackup, reviewItems: [item] }), 'recurrenceDays');
  });

  it('rejects impossible dates', () => {
    const device = {
      id: 'd1', label: 'D', role: 'R', category: 'other', ownerIds: [], model: '', os: '',
      serialNumber: '', purchaseDate: '2023-02-30', location: '', encrypted: 'unknown',
      recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '',
    };
    expectFailure(JSON.stringify({ ...validBackup, devices: [device] }), 'purchaseDate');
  });

  it('rejects invalid timestamps', () => {
    expectFailure(JSON.stringify({ ...validBackup, exportedAt: '2023-13-01T00:00:00Z' }), 'exportedAt');
  });

  it('rejects oversized input measured by encoded bytes', () => {
    const giant = '💾'.repeat(2_000_000); // 4 bytes per character, well over 5 MiB.
    const person = { id: 'p1', name: giant, role: 'me', notes: '', visibility: 'private' };
    expectFailure(JSON.stringify({ ...validBackup, people: [person] }), 'too large');
  });

  it('rejects malformed legacy backups that cannot migrate', () => {
    const legacy = {
      schemaVersion: 1,
      exportedAt: '',
      lastExportAt: '',
      onboardingComplete: true,
      people: [{ id: 'p1', name: 'Me', role: 'me', notes: '', visibility: 'do-not-export' }],
      devices: [], accounts: [], backups: [], recoveryReferences: [], dependencies: [], reviewItems: [],
    };
    const result = parseImport(JSON.stringify(legacy));
    expect(result.success).toBe(true);
    expect(result.data?.people[0].visibility).toBe('backup-only');
  });

  it('requires source on current-schema review items', () => {
    const current = { ...validBackup, schemaVersion: 2 };
    const item = {
      id: 'ri1', title: 'T', recurrenceDays: null, lastReviewedDate: '', nextReviewDate: '',
      status: 'ok', notes: '', linkedEntityIds: [],
    };
    expectFailure(JSON.stringify({ ...current, reviewItems: [item] }), 'source');
  });
});
