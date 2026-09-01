import { describe, it, expect } from 'vitest';
import { buildFullExport, buildHelperExport, buildPassportHtml } from './export';
import { DEFAULT_ME } from '../constants';
import type { AppState } from '../types';

const emptyState: AppState = {
  schemaVersion: 1,
  people: [DEFAULT_ME],
  devices: [], accounts: [], backups: [],
  recoveryReferences: [], dependencies: [], reviewItems: [],
  onboardingComplete: true, lastExportAt: '',
};

describe('export', () => {
  it('full export contains all entities', () => {
    const state: AppState = {
      ...emptyState,
      devices: [{ id: 'd1', label: 'Router', role: 'Internet', category: 'router', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '' }],
    };
    const backup = buildFullExport(state);
    expect(backup.devices).toHaveLength(1);
    expect(backup.people).toHaveLength(1);
    expect(backup.schemaVersion).toBe(1);
  });

  it('helper export excludes private and backup-only', () => {
    const state: AppState = {
      ...emptyState,
      devices: [
        { id: 'd1', label: 'Private', role: 'R1', category: 'other', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '' },
        { id: 'd2', label: 'Helper', role: 'R2', category: 'other', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'helper-safe', reviewDate: '' },
        { id: 'd3', label: 'BackupOnly', role: 'R3', category: 'other', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'backup-only', reviewDate: '' },
      ],
    };
    const backup = buildHelperExport(state);
    expect(backup.devices.map(d => d.id)).toEqual(['d2']);
  });

  it('helper export strips private references from devices and accounts', () => {
    const helperPerson = { id: 'p2', name: 'Helper', role: 'trusted-helper' as const, notes: '', visibility: 'helper-safe' as const };
    const privateRef = { id: 'r1', label: 'Safe combo', kind: 'physical-safe' as const, location: '', contactInfo: '', notes: '', visibility: 'private' as const };
    const helperRef = { id: 'r2', label: 'Password manager', kind: 'password-manager' as const, location: '', contactInfo: '', notes: '', visibility: 'helper-safe' as const };
    const state: AppState = {
      ...emptyState,
      people: [DEFAULT_ME, helperPerson],
      recoveryReferences: [privateRef, helperRef],
      devices: [
        { id: 'd1', label: 'Phone', role: 'Mobile', category: 'phone', ownerIds: [DEFAULT_ME.id, helperPerson.id], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [privateRef.id, helperRef.id], notes: '', visibility: 'helper-safe', reviewDate: '' },
      ],
      accounts: [
        { id: 'a1', label: 'Email', provider: '', purpose: '', personIds: [DEFAULT_ME.id, helperPerson.id], mfa: 'unknown', recoveryReferenceIds: [privateRef.id, helperRef.id], notes: '', visibility: 'helper-safe', reviewDate: '' },
      ],
    };
    const backup = buildHelperExport(state);
    expect(backup.devices[0].ownerIds).toEqual([helperPerson.id]);
    expect(backup.devices[0].recoveryReferenceIds).toEqual([helperRef.id]);
    expect(backup.accounts[0].personIds).toEqual([helperPerson.id]);
    expect(backup.accounts[0].recoveryReferenceIds).toEqual([helperRef.id]);
  });

  it('helper export excludes review items linked to private entities', () => {
    const state: AppState = {
      ...emptyState,
      devices: [
        { id: 'd1', label: 'Private', role: 'R1', category: 'other', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '' },
        { id: 'd2', label: 'Helper', role: 'R2', category: 'other', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'helper-safe', reviewDate: '' },
      ],
      reviewItems: [
        { id: 'ri1', title: 'Private review', recurrenceDays: null, lastReviewedDate: '', nextReviewDate: '', status: 'ok', notes: '', linkedEntityIds: ['d1'], source: 'user' },
        { id: 'ri2', title: 'Helper review', recurrenceDays: null, lastReviewedDate: '', nextReviewDate: '', status: 'ok', notes: '', linkedEntityIds: ['d2'], source: 'user' },
        { id: 'ri3', title: 'Mixed review', recurrenceDays: null, lastReviewedDate: '', nextReviewDate: '', status: 'ok', notes: '', linkedEntityIds: ['d1', 'd2'], source: 'user' },
      ],
    };
    const backup = buildHelperExport(state);
    expect(backup.reviewItems.map(r => r.id)).toEqual(['ri2']);
  });

  it('legacy do-not-export is treated as backup-only', () => {
    const state: AppState = {
      ...emptyState,
      devices: [
        { id: 'd1', label: 'Legacy', role: 'R1', category: 'other', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'do-not-export', reviewDate: '' },
      ],
    };
    const backup = buildHelperExport(state);
    expect(backup.devices).toHaveLength(0);
  });

  it('helper export filters backup coversIds to allowed devices and accounts', () => {
    const helperDevice = {
      id: 'd-helper', label: 'Helper device', role: 'R1', category: 'other' as const,
      ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '',
      encrypted: 'unknown' as const, recoveryReferenceIds: [], notes: '', visibility: 'helper-safe' as const, reviewDate: '',
    };
    const privateDevice = {
      id: 'd-private', label: 'Private device', role: 'R2', category: 'other' as const,
      ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '',
      encrypted: 'unknown' as const, recoveryReferenceIds: [], notes: '', visibility: 'private' as const, reviewDate: '',
    };
    const backupOnlyDevice = {
      id: 'd-backup', label: 'Backup-only device', role: 'R3', category: 'other' as const,
      ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '',
      encrypted: 'unknown' as const, recoveryReferenceIds: [], notes: '', visibility: 'backup-only' as const, reviewDate: '',
    };
    const helperAccount = {
      id: 'a-helper', label: 'Helper account', provider: '', purpose: '', personIds: [],
      mfa: 'unknown' as const, recoveryReferenceIds: [], notes: '', visibility: 'helper-safe' as const, reviewDate: '',
    };
    const helperBackup = {
      id: 'b1', label: 'Helper backup', destination: '', recoveryReferenceIds: [],
      coversIds: ['d-helper', 'd-private', 'd-backup', 'a-helper'],
      copies: 'one' as const, lastCheckedDate: '', restoreTestedDate: '', restored: 'unknown' as const,
      canRestorePersonIds: [], notes: '', visibility: 'helper-safe' as const, reviewDate: '',
    };
    const state: AppState = {
      ...emptyState,
      devices: [helperDevice, privateDevice, backupOnlyDevice],
      accounts: [helperAccount],
      backups: [helperBackup],
    };
    const backup = buildHelperExport(state);
    expect(backup.backups[0].coversIds).toEqual(['d-helper', 'a-helper']);
    expect(backup.devices.map(d => d.id)).toEqual(['d-helper']);
    expect(backup.accounts.map(a => a.id)).toEqual(['a-helper']);
  });

  it('excludes review items linked to private or backup-only entities', () => {
    const state: AppState = {
      ...emptyState,
      devices: [
        { id: 'd-private', label: 'Private', role: 'R1', category: 'other', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '' },
        { id: 'd-helper', label: 'Helper', role: 'R2', category: 'other', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'helper-safe', reviewDate: '' },
      ],
      reviewItems: [
        { id: 'ri-private', title: 'Private review', recurrenceDays: null, lastReviewedDate: '', nextReviewDate: '', status: 'ok', notes: '', linkedEntityIds: ['d-private'], source: 'user' },
        { id: 'ri-helper', title: 'Helper review', recurrenceDays: null, lastReviewedDate: '', nextReviewDate: '', status: 'ok', notes: '', linkedEntityIds: ['d-helper'], source: 'user' },
        { id: 'ri-mixed', title: 'Mixed review', recurrenceDays: null, lastReviewedDate: '', nextReviewDate: '', status: 'ok', notes: '', linkedEntityIds: ['d-private', 'd-helper'], source: 'user' },
        { id: 'ri-unlinked-user', title: 'Unlinked user', recurrenceDays: null, lastReviewedDate: '', nextReviewDate: '', status: 'ok', notes: '', linkedEntityIds: [], source: 'user' },
        { id: 'ri-unlinked-app', title: 'Export your Passport', recurrenceDays: 30, lastReviewedDate: '', nextReviewDate: '', status: 'due', notes: '', linkedEntityIds: [], source: 'app' },
      ],
    };
    const backup = buildHelperExport(state);
    expect(backup.reviewItems.map(r => r.id)).toEqual(['ri-helper', 'ri-unlinked-app']);
  });
});

describe('buildPassportHtml', () => {
  it('includes priority actions for missing backups and overdue checks', () => {
    const meId = DEFAULT_ME.id;
    const state: AppState = {
      ...emptyState,
      devices: [
        { id: 'd1', label: 'MacBook', role: 'Main computer', category: 'computer', ownerIds: [meId], model: '', os: 'mac', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'helper-safe', reviewDate: '' },
      ],
      backups: [
        { id: 'b1', label: 'Time Machine', destination: 'External drive', recoveryReferenceIds: [], coversIds: [], copies: 'one', lastCheckedDate: '2023-01-01', restoreTestedDate: '', restored: 'unknown', canRestorePersonIds: [], notes: '', visibility: 'helper-safe', reviewDate: '' },
      ],
    };
    const html = buildPassportHtml(state, { title: 'Test', subtitle: 'Test', sensitivityNotice: '', allowed: ['helper-safe', 'emergency'] });
    expect(html).toContain('What to do first');
    expect(html).toContain('Back up these devices: MacBook');
    expect(html).toContain('Check these backups: Time Machine');
  });

  it('includes ownership, recovery, and dependency details', () => {
    const meId = DEFAULT_ME.id;
    const ref = { id: 'r1', label: 'Password manager', kind: 'password-manager' as const, location: '1Password', contactInfo: '', notes: '', visibility: 'helper-safe' as const };
    const state: AppState = {
      ...emptyState,
      recoveryReferences: [ref],
      devices: [
        { id: 'd1', label: 'MacBook', role: 'Main computer', category: 'computer', ownerIds: [meId], model: '', os: 'mac', serialNumber: '', purchaseDate: '', location: 'Office', encrypted: 'yes', recoveryReferenceIds: [ref.id], notes: '', visibility: 'helper-safe', reviewDate: '' },
      ],
      dependencies: [
        { id: 'dep1', sourceId: 'd1', targetId: ref.id, kind: 'requires', notes: '' },
      ],
    };
    const html = buildPassportHtml(state, { title: 'Test', subtitle: 'Test', sensitivityNotice: '', allowed: ['helper-safe', 'emergency'] });
    expect(html).toContain('Recovery info');
    expect(html).toContain('What relies on what');
    expect(html).toContain('MacBook');
    expect(html).toContain('Password manager');
  });

  it('notes intentionally omitted private entities', () => {
    const state: AppState = {
      ...emptyState,
      people: [
        { id: 'p1', name: 'Me', role: 'me' as const, notes: '', visibility: 'private' as const },
      ],
      devices: [
        { id: 'd1', label: 'Secret phone', role: 'Phone', category: 'phone', ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '', encrypted: 'unknown', recoveryReferenceIds: [], notes: '', visibility: 'private', reviewDate: '' },
      ],
    };
    const html = buildPassportHtml(state, { title: 'Test', subtitle: 'Test', sensitivityNotice: '', allowed: ['helper-safe', 'emergency'] });
    expect(html).toContain('What this copy does not include');
    expect(html).toContain('1 device');
    expect(html).toContain('marked as not safe to share');
  });

  it('escapes user-controlled values so they cannot become executable markup', () => {
    const payload = "<script>globalThis.pwned=true</script>";
    const breakOut = "</td><img src=x onerror=alert(1)>";
    const quotes = `"'<>&`;
    const ref = {
      id: 'r1', label: `Password manager ${payload}`, kind: 'password-manager' as const,
      location: `Safe ${breakOut}`, contactInfo: `Contact ${quotes}`, notes: `Notes ${payload}`,
      visibility: 'helper-safe' as const,
    };
    const state: AppState = {
      ...emptyState,
      people: [{ id: 'p2', name: `Helper ${payload}`, role: 'trusted-helper' as const, notes: `Notes ${breakOut}`, visibility: 'helper-safe' as const }],
      recoveryReferences: [ref],
      devices: [
        { id: 'd1', label: `MacBook ${payload}`, role: `Computer ${breakOut}`, category: 'computer' as const,
          ownerIds: ['p2'], model: `Model ${quotes}`, os: `OS ${payload}`, serialNumber: '',
          purchaseDate: '', location: `Office ${breakOut}`, encrypted: 'yes' as const,
          recoveryReferenceIds: [ref.id], notes: `Notes ${payload}`, visibility: 'helper-safe' as const, reviewDate: '' },
      ],
      accounts: [
        { id: 'a1', label: `Email ${payload}`, provider: `Provider ${breakOut}`, purpose: `Purpose ${quotes}`,
          personIds: ['p2'], mfa: 'yes' as const, recoveryReferenceIds: [ref.id], notes: `Notes ${breakOut}`,
          visibility: 'helper-safe' as const, reviewDate: '' },
      ],
      backups: [
        { id: 'b1', label: `Backup ${payload}`, destination: `Drive ${breakOut}`, recoveryReferenceIds: [ref.id],
          coversIds: ['d1'], copies: 'one' as const, lastCheckedDate: '2023-01-01', restoreTestedDate: '',
          restored: 'unknown' as const, canRestorePersonIds: ['p2'], notes: `Notes ${quotes}`,
          visibility: 'helper-safe' as const, reviewDate: '' },
      ],
      dependencies: [
        { id: 'dep1', sourceId: 'd1', targetId: ref.id, kind: 'requires' as const, notes: `Dependency ${payload}` },
      ],
      reviewItems: [
        { id: 'ri1', title: `Review ${payload}`, recurrenceDays: null, lastReviewedDate: '', nextReviewDate: '',
          status: 'due', notes: `Review notes ${breakOut}`, linkedEntityIds: ['d1'], source: 'user' },
      ],
    };
    const html = buildPassportHtml(state, {
      title: `Test ${payload}`,
      subtitle: `Subtitle ${breakOut}`,
      sensitivityNotice: `Notice ${quotes}`,
      allowed: ['helper-safe', 'emergency'],
    });

    expect(html).not.toContain(payload);
    expect(html).not.toContain(breakOut);
    expect(html).toContain('&lt;script&gt;globalThis.pwned=true&lt;/script&gt;');
    expect(html).toContain('&lt;/td&gt;&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&quot;&#039;&lt;&gt;&amp;');

    // A downloaded Passport opened outside the preview sandbox must not find
    // raw markup that could become executable.
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/<img[^>]*onerror/i);
  });

  it('does not show Unknown labels from filtered backup references', () => {
    const helperDevice = {
      id: 'd-helper', label: 'Helper device', role: 'R1', category: 'other' as const,
      ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '',
      encrypted: 'unknown' as const, recoveryReferenceIds: [], notes: '', visibility: 'helper-safe' as const, reviewDate: '',
    };
    const privateDevice = {
      id: 'd-private', label: 'Private device', role: 'R2', category: 'other' as const,
      ownerIds: [], model: '', os: '', serialNumber: '', purchaseDate: '', location: '',
      encrypted: 'unknown' as const, recoveryReferenceIds: [], notes: '', visibility: 'private' as const, reviewDate: '',
    };
    const helperBackup = {
      id: 'b1', label: 'Helper backup', destination: '', recoveryReferenceIds: [],
      coversIds: ['d-helper', 'd-private'],
      copies: 'one' as const, lastCheckedDate: '', restoreTestedDate: '', restored: 'unknown' as const,
      canRestorePersonIds: [], notes: '', visibility: 'helper-safe' as const, reviewDate: '',
    };
    const state: AppState = {
      ...emptyState,
      devices: [helperDevice, privateDevice],
      backups: [helperBackup],
    };
    const html = buildPassportHtml(state, { title: 'Test', subtitle: 'Test', sensitivityNotice: '', allowed: ['helper-safe', 'emergency'] });
    expect(html).toContain('Helper device');
    expect(html).not.toContain('Unknown');
    expect(html).not.toContain('Private device');
  });
});
